import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { buildBoardObligationWhatIfPack } from "@/lib/compliance/board-obligation-whatif";
import { buildObligationOwnerLoadBalancingPack } from "@/lib/compliance/obligation-owner-load-balancing";
import type { LoadBalancingSuggestion } from "@/lib/compliance/obligation-owner-load-balancing";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const OBLIGATION_STAFFING_ACTION_TRACKER_VERSION =
  "zentro-obligation-staffing-action-tracker/1";

export const DEFAULT_STAFFING_TRACKER_HORIZON_DAYS = 90;

export type StaffingActionType = "load_balance" | "capacity_whatif";

export type StaffingActionStatus = "accepted" | "in_progress" | "completed" | "dismissed";

export type StaffingActionRow = {
  id: string;
  orgId: string;
  actionKey: string;
  actionType: StaffingActionType;
  title: string;
  status: StaffingActionStatus;
  peakWeekKey: string | null;
  sourceDetail: string | null;
  obligationId: string | null;
  fromOwnerLabel: string | null;
  toOwnerLabel: string | null;
  whatifScenarioId: string | null;
  assigneeUserId: string | null;
  operatorNote: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type StaffingActionProposal = {
  actionKey: string;
  actionType: StaffingActionType;
  title: string;
  peakWeekKey: string | null;
  sourceDetail: string;
  obligationId: string | null;
  fromOwnerLabel: string | null;
  toOwnerLabel: string | null;
  whatifScenarioId: string | null;
  suggestedAssigneeUserId: string | null;
};

export type StaffingActionTrackerItem = {
  proposal: StaffingActionProposal;
  tracked: StaffingActionRow | null;
  status: StaffingActionStatus | "proposed";
  isOpen: boolean;
};

export type StaffingActionTrackerStats = {
  proposed: number;
  accepted: number;
  inProgress: number;
  completed: number;
  dismissed: number;
  open: number;
};

export type ObligationStaffingActionTrackerPack = {
  version: typeof OBLIGATION_STAFFING_ACTION_TRACKER_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  peakWeekKey: string | null;
  stats: StaffingActionTrackerStats;
  items: StaffingActionTrackerItem[];
  committeeSummary: string;
};

function rowFromDb(raw: Record<string, unknown>): StaffingActionRow {
  return {
    id: String(raw.id),
    orgId: String(raw.org_id),
    actionKey: String(raw.action_key),
    actionType: raw.action_type as StaffingActionType,
    title: String(raw.title),
    status: raw.status as StaffingActionStatus,
    peakWeekKey: raw.peak_week_key ? String(raw.peak_week_key) : null,
    sourceDetail: raw.source_detail ? String(raw.source_detail) : null,
    obligationId: raw.obligation_id ? String(raw.obligation_id) : null,
    fromOwnerLabel: raw.from_owner_label ? String(raw.from_owner_label) : null,
    toOwnerLabel: raw.to_owner_label ? String(raw.to_owner_label) : null,
    whatifScenarioId: raw.whatif_scenario_id ? String(raw.whatif_scenario_id) : null,
    assigneeUserId: raw.assignee_user_id ? String(raw.assignee_user_id) : null,
    operatorNote: raw.operator_note ? String(raw.operator_note) : null,
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
    completedAt: raw.completed_at ? String(raw.completed_at) : null,
  };
}

export function loadBalanceActionKey(obligationId: string): string {
  return `load_balance:${obligationId}`;
}

export function whatIfActionKey(scenarioId: string): string {
  return `capacity_whatif:${scenarioId}`;
}

export function proposalsFromLoadBalancing(input: {
  suggestions: LoadBalancingSuggestion[];
  peakWeekKey: string | null;
}): StaffingActionProposal[] {
  return input.suggestions.map((s) => ({
    actionKey: loadBalanceActionKey(s.obligationId),
    actionType: "load_balance",
    title: `Reassign: ${s.obligationTitle}`,
    peakWeekKey: input.peakWeekKey,
    sourceDetail: s.reason,
    obligationId: s.obligationId,
    fromOwnerLabel: s.fromOwnerLabel,
    toOwnerLabel: s.toOwnerLabel,
    whatifScenarioId: null,
    suggestedAssigneeUserId: s.toOwnerUserId,
  }));
}

export function proposalsFromWhatIf(input: {
  results: { scenarioId: string; title: string; summary: string; peakWeekDelta: number }[];
  peakWeekKey: string | null;
}): StaffingActionProposal[] {
  return input.results
    .filter((r) => r.peakWeekDelta < 0)
    .map((r) => ({
      actionKey: whatIfActionKey(r.scenarioId),
      actionType: "capacity_whatif",
      title: r.title,
      peakWeekKey: input.peakWeekKey,
      sourceDetail: `${r.summary} (peak week Δ${r.peakWeekDelta})`,
      obligationId: null,
      fromOwnerLabel: null,
      toOwnerLabel: null,
      whatifScenarioId: r.scenarioId,
      suggestedAssigneeUserId: null,
    }));
}

export function mergeStaffingTrackerItems(input: {
  proposals: StaffingActionProposal[];
  tracked: StaffingActionRow[];
}): StaffingActionTrackerItem[] {
  const trackedByKey = new Map(input.tracked.map((t) => [t.actionKey, t]));
  const proposalKeys = new Set(input.proposals.map((p) => p.actionKey));

  const fromProposals: StaffingActionTrackerItem[] = input.proposals.map((proposal) => {
    const row = trackedByKey.get(proposal.actionKey) ?? null;
    const status = row?.status ?? "proposed";
    return {
      proposal,
      tracked: row,
      status,
      isOpen: status !== "completed" && status !== "dismissed",
    };
  });

  const orphanTracked: StaffingActionTrackerItem[] = input.tracked
    .filter((t) => !proposalKeys.has(t.actionKey))
    .map((row) => ({
      proposal: {
        actionKey: row.actionKey,
        actionType: row.actionType,
        title: row.title,
        peakWeekKey: row.peakWeekKey,
        sourceDetail: row.sourceDetail ?? "",
        obligationId: row.obligationId,
        fromOwnerLabel: row.fromOwnerLabel,
        toOwnerLabel: row.toOwnerLabel,
        whatifScenarioId: row.whatifScenarioId,
        suggestedAssigneeUserId: row.assigneeUserId,
      },
      tracked: row,
      status: row.status,
      isOpen: row.status !== "completed" && row.status !== "dismissed",
    }));

  return [...fromProposals, ...orphanTracked].sort((a, b) => {
    const rank = (s: string) =>
      s === "proposed" ? 0 : s === "accepted" ? 1 : s === "in_progress" ? 2 : 3;
    return rank(a.status) - rank(b.status) || a.proposal.title.localeCompare(b.proposal.title);
  });
}

export function computeStaffingTrackerStats(items: StaffingActionTrackerItem[]): StaffingActionTrackerStats {
  const stats: StaffingActionTrackerStats = {
    proposed: 0,
    accepted: 0,
    inProgress: 0,
    completed: 0,
    dismissed: 0,
    open: 0,
  };
  for (const item of items) {
    if (item.status === "proposed") stats.proposed += 1;
    else if (item.status === "accepted") stats.accepted += 1;
    else if (item.status === "in_progress") stats.inProgress += 1;
    else if (item.status === "completed") stats.completed += 1;
    else if (item.status === "dismissed") stats.dismissed += 1;
    if (item.isOpen) stats.open += 1;
  }
  return stats;
}

export function buildObligationStaffingActionTrackerFromParts(input: {
  orgId: string | null;
  horizonDays: number;
  peakWeekKey: string | null;
  proposals: StaffingActionProposal[];
  tracked: StaffingActionRow[];
  generatedAt?: string;
}): ObligationStaffingActionTrackerPack {
  const items = mergeStaffingTrackerItems({
    proposals: input.proposals,
    tracked: input.tracked,
  });
  const stats = computeStaffingTrackerStats(items);

  let committeeSummary: string;
  if (items.length === 0) {
    committeeSummary =
      "No staffing relief proposals — run load balancing and what-if when peak week is under pressure.";
  } else if (stats.open === 0) {
    committeeSummary = `All ${items.length} staffing action(s) are closed (completed or dismissed).`;
  } else {
    committeeSummary = `${stats.open} open staffing action(s): ${stats.proposed} proposed, ${stats.accepted} accepted, ${stats.inProgress} in progress.`;
  }

  return {
    version: OBLIGATION_STAFFING_ACTION_TRACKER_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    peakWeekKey: input.peakWeekKey,
    stats,
    items,
    committeeSummary,
  };
}

export async function listStaffingActions(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<StaffingActionRow[]> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_obligation_staffing_actions")
    .select(
      "id, org_id, action_key, action_type, title, status, peak_week_key, source_detail, obligation_id, from_owner_label, to_owner_label, whatif_scenario_id, assignee_user_id, operator_note, created_at, updated_at, completed_at",
    )
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowFromDb(row as Record<string, unknown>));
}

export async function buildObligationStaffingActionTrackerPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ObligationStaffingActionTrackerPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? DEFAULT_STAFFING_TRACKER_HORIZON_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [loadBalance, whatIf, tracked] = await Promise.all([
    buildObligationOwnerLoadBalancingPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildBoardObligationWhatIfPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    listStaffingActions(opts.orgId, supabase),
  ]);

  const peakWeekKey =
    loadBalance?.peakWeekKey ?? whatIf?.baseline.peakWeekKey ?? null;

  const proposals = [
    ...proposalsFromLoadBalancing({
      suggestions: loadBalance?.suggestions ?? [],
      peakWeekKey,
    }),
    ...proposalsFromWhatIf({
      results: (whatIf?.results ?? []).map((r) => ({
        scenarioId: r.scenario.id,
        title: r.scenario.title,
        summary: r.scenario.summary,
        peakWeekDelta: r.peakWeekDelta,
      })),
      peakWeekKey,
    }),
  ];

  return buildObligationStaffingActionTrackerFromParts({
    orgId: opts.orgId,
    horizonDays,
    peakWeekKey,
    proposals,
    tracked,
  });
}

export async function acceptStaffingAction(
  userId: string,
  orgId: string,
  proposal: StaffingActionProposal,
  supabase?: SupabaseClient,
): Promise<{ ok: true; row: StaffingActionRow } | { ok: false; error: string }> {
  const client = supabase ?? (await createServerSupabaseClient());

  const { data: existing } = await client
    .from("compliance_obligation_staffing_actions")
    .select("id")
    .eq("org_id", orgId)
    .eq("action_key", proposal.actionKey)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "Action already accepted." };
  }

  const { data, error } = await client
    .from("compliance_obligation_staffing_actions")
    .insert({
      org_id: orgId,
      action_key: proposal.actionKey,
      action_type: proposal.actionType,
      title: proposal.title,
      status: "accepted",
      peak_week_key: proposal.peakWeekKey,
      source_detail: proposal.sourceDetail,
      obligation_id: proposal.obligationId,
      from_owner_label: proposal.fromOwnerLabel,
      to_owner_label: proposal.toOwnerLabel,
      whatif_scenario_id: proposal.whatifScenarioId,
      assignee_user_id: proposal.suggestedAssigneeUserId,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, org_id, action_key, action_type, title, status, peak_week_key, source_detail, obligation_id, from_owner_label, to_owner_label, whatif_scenario_id, assignee_user_id, operator_note, created_at, updated_at, completed_at",
    )
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  const row = rowFromDb(data as Record<string, unknown>);

  await appendAuditEvent({
    event_type: "governance.obligation_staffing_action_accepted",
    user_id: userId,
    org_id: orgId,
    details: {
      action_id: row.id,
      action_key: row.actionKey,
      action_type: row.actionType,
      peak_week_key: row.peakWeekKey,
    },
  });

  return { ok: true, row };
}

export async function updateStaffingActionStatus(
  userId: string,
  orgId: string,
  actionId: string,
  status: StaffingActionStatus,
  opts?: { operatorNote?: string; supabase?: SupabaseClient },
): Promise<boolean> {
  const client = opts?.supabase ?? (await createServerSupabaseClient());
  const completedAt =
    status === "completed" || status === "dismissed" ? new Date().toISOString() : null;

  const patch: Record<string, unknown> = {
    status,
    updated_by: userId,
    updated_at: new Date().toISOString(),
    completed_at: completedAt,
  };
  if (opts?.operatorNote !== undefined) {
    patch.operator_note = opts.operatorNote;
  }

  const { data, error } = await client
    .from("compliance_obligation_staffing_actions")
    .update(patch)
    .eq("id", actionId)
    .eq("org_id", orgId)
    .select("action_key, action_type")
    .maybeSingle();

  if (error || !data) return false;

  await appendAuditEvent({
    event_type: "governance.obligation_staffing_action_updated",
    user_id: userId,
    org_id: orgId,
    details: {
      action_id: actionId,
      status,
      action_key: data.action_key,
      action_type: data.action_type,
    },
  });

  return true;
}

export function buildStaffingCompletionReportHtml(
  pack: ObligationStaffingActionTrackerPack,
  orgName: string,
): string {
  const rows = pack.items
    .map(
      (item) =>
        `<tr><td>${item.status}</td><td>${item.proposal.actionType}</td><td>${escapeHtml(item.proposal.title)}</td><td>${item.proposal.peakWeekKey ?? "—"}</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Staffing completion — ${escapeHtml(orgName)}</title>
<style>body{font-family:system-ui,sans-serif;padding:2rem;max-width:900px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f4f4f4}</style></head>
<body><h1>Staffing action completion report</h1><p>${escapeHtml(orgName)} · ${pack.generatedAt.slice(0, 10)}</p>
<p>${escapeHtml(pack.committeeSummary)}</p>
<ul><li>Proposed: ${pack.stats.proposed}</li><li>Accepted: ${pack.stats.accepted}</li><li>In progress: ${pack.stats.inProgress}</li><li>Completed: ${pack.stats.completed}</li><li>Dismissed: ${pack.stats.dismissed}</li></ul>
<table><thead><tr><th>Status</th><th>Type</th><th>Title</th><th>Peak week</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function obligationStaffingActionTrackerToCsv(
  pack: ObligationStaffingActionTrackerPack,
): string {
  const lines = [
    "action_key,action_type,title,status,peak_week_key,from_owner,to_owner,tracked",
    ...pack.items.map((item) =>
      [
        item.proposal.actionKey,
        item.proposal.actionType,
        JSON.stringify(item.proposal.title),
        item.status,
        item.proposal.peakWeekKey ?? "",
        JSON.stringify(item.proposal.fromOwnerLabel ?? ""),
        JSON.stringify(item.proposal.toOwnerLabel ?? ""),
        item.tracked ? "1" : "0",
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
