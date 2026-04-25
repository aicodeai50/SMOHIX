import type { SupabaseClient } from "@supabase/supabase-js";

import {
  parseMaxBlastScope,
  type BlastRadiusScope,
} from "@/lib/approvals/policy-scope";
import type { PolicySuggestionStatus } from "@/lib/decision-intelligence";

export type PolicySuggestionRow = {
  id: string;
  playbookId: string;
  suggestionKey: string;
  label: string;
  reason: string;
  confidenceScore: number;
  guardrails: string[];
  status: PolicySuggestionStatus;
  reviewerNotes: string | null;
  promotedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type AcceptedPolicyGuardrails = {
  playbookId: string;
  maxBlastRadius: BlastRadiusScope | null;
  requireDryRunFresh: boolean;
  requireChangeWindow: boolean;
  suggestionIds: string[];
};

type AcceptedGuardrailSourceRow = {
  id: unknown;
  playbook_id: unknown;
  suggestion_key: unknown;
  guardrails_json: unknown;
  reviewer_notes: unknown;
};

function pickStrictestMaxBlastRadius(
  current: AcceptedPolicyGuardrails["maxBlastRadius"],
  next: AcceptedPolicyGuardrails["maxBlastRadius"],
): AcceptedPolicyGuardrails["maxBlastRadius"] {
  const rank = { service: 1, cluster: 2, region: 3, global: 4 } as const;
  if (!current) return next;
  if (!next) return current;
  return rank[next] < rank[current] ? next : current;
}

export async function upsertPolicySuggestion(
  supabase: SupabaseClient,
  input: {
    userId: string;
    playbookId: string;
    suggestionKey: string;
    label: string;
    reason: string;
    confidenceScore: number;
    guardrails: string[];
  },
): Promise<void> {
  await supabase.from("policy_suggestions").upsert(
    {
      user_id: input.userId,
      playbook_id: input.playbookId,
      suggestion_key: input.suggestionKey,
      label: input.label,
      reason: input.reason,
      confidence_score: input.confidenceScore,
      guardrails_json: input.guardrails,
      status: "proposed",
    },
    { onConflict: "user_id,suggestion_key" },
  );
}

export async function listPolicySuggestionsForUser(
  supabase: SupabaseClient,
  userId: string,
  status?: PolicySuggestionStatus | "all",
): Promise<PolicySuggestionRow[]> {
  let q = supabase
    .from("policy_suggestions")
    .select(
      "id, playbook_id, suggestion_key, label, reason, confidence_score, guardrails_json, status, reviewer_notes, promoted_at, reviewed_at, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q.limit(100);
  if (error || !data) return [];
  return data.map((r) => ({
    id: String(r.id),
    playbookId: String(r.playbook_id),
    suggestionKey: String(r.suggestion_key),
    label: String(r.label),
    reason: String(r.reason ?? ""),
    confidenceScore: Number(r.confidence_score ?? 0),
    guardrails: Array.isArray(r.guardrails_json) ? (r.guardrails_json as string[]) : [],
    status: (String(r.status ?? "proposed") as PolicySuggestionStatus),
    reviewerNotes: r.reviewer_notes ? String(r.reviewer_notes) : null,
    promotedAt: r.promoted_at ? String(r.promoted_at) : null,
    reviewedAt: r.reviewed_at ? String(r.reviewed_at) : null,
    createdAt: String(r.created_at),
  }));
}

function parseMaxBlastRadiusFromSuggestionKey(
  suggestionKey: string | null,
): AcceptedPolicyGuardrails["maxBlastRadius"] {
  if (!suggestionKey) return null;
  const lower = suggestionKey.toLowerCase();
  if (lower.includes("-service-")) return "service";
  if (lower.includes("-cluster-")) return "cluster";
  if (lower.includes("-region-")) return "region";
  if (lower.includes("-global-")) return "global";
  return null;
}

export async function listAcceptedPolicyGuardrailsForPlaybook(
  supabase: SupabaseClient,
  userId: string,
  playbookId: string,
): Promise<AcceptedPolicyGuardrails | null> {
  const { data, error } = await supabase
    .from("policy_suggestions")
    .select("id, suggestion_key, guardrails_json, reviewer_notes")
    .eq("user_id", userId)
    .eq("playbook_id", playbookId)
    .eq("status", "accepted")
    .limit(20);
  if (error || !data || data.length === 0) return null;
  const map = aggregateAcceptedPolicyGuardrails(data as AcceptedGuardrailSourceRow[]);
  return map[playbookId] ?? null;
}

function aggregateAcceptedPolicyGuardrails(
  rows: AcceptedGuardrailSourceRow[],
): Record<string, AcceptedPolicyGuardrails> {
  const grouped: Record<string, AcceptedPolicyGuardrails> = {};
  for (const row of rows) {
    const playbookId = String(row.playbook_id ?? "");
    if (!playbookId) continue;
    if (!grouped[playbookId]) {
      grouped[playbookId] = {
        playbookId,
        maxBlastRadius: null,
        requireDryRunFresh: false,
        requireChangeWindow: false,
        suggestionIds: [],
      };
    }
    const item = grouped[playbookId];
    const guardrails = Array.isArray(row.guardrails_json)
      ? (row.guardrails_json as string[]).map((g) => g.toLowerCase())
      : [];
    if (guardrails.some((g) => g.includes("dry-run") || g.includes("dry run"))) {
      item.requireDryRunFresh = true;
    }
    if (guardrails.some((g) => g.includes("change window"))) {
      item.requireChangeWindow = true;
    }
    const parsedFromNotes = parseMaxBlastScope((row.reviewer_notes as string | null) ?? null);
    const parsedFromKey = parseMaxBlastRadiusFromSuggestionKey(
      (row.suggestion_key as string | null) ?? null,
    );
    item.maxBlastRadius = pickStrictestMaxBlastRadius(
      item.maxBlastRadius,
      parsedFromNotes ?? parsedFromKey,
    );
    item.suggestionIds.push(String(row.id));
  }
  return grouped;
}

export async function listAcceptedPolicyGuardrailsByPlaybook(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, AcceptedPolicyGuardrails>> {
  const { data, error } = await supabase
    .from("policy_suggestions")
    .select("id, playbook_id, suggestion_key, guardrails_json, reviewer_notes")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .limit(200);
  if (error || !data || data.length === 0) return {};
  return aggregateAcceptedPolicyGuardrails(data as AcceptedGuardrailSourceRow[]);
}

export async function updatePolicySuggestionStatus(
  supabase: SupabaseClient,
  input: {
    userId: string;
    id?: string;
    suggestionKey?: string;
    playbookId?: string;
    status: PolicySuggestionStatus;
    reviewerNotes?: string;
    promoted?: boolean;
  },
): Promise<boolean> {
  const patch: Record<string, unknown> = {
    status: input.status,
    reviewed_at: new Date().toISOString(),
    reviewer_notes: input.reviewerNotes?.trim() || null,
  };
  if (input.promoted) patch.promoted_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("policy_suggestions")
    .update(patch)
    .eq("user_id", input.userId)
    .match(
      input.id
        ? { id: input.id }
        : {
            suggestion_key: input.suggestionKey ?? "",
            playbook_id: input.playbookId ?? "",
          },
    )
    .select("id")
    .maybeSingle();
  return !error && Boolean(data?.id);
}
