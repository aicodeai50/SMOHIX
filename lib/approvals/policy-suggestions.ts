import type { SupabaseClient } from "@supabase/supabase-js";

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
