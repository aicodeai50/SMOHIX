import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { buildDecisionBrief, parseDecisionBrief } from "@/lib/decision-intelligence";

import { devCreateApproval, devListApprovals } from "./dev-store";
import type { ApprovalRow, ApprovalsListResult } from "./types";

function mapRow(r: {
  id: string;
  action_label: string;
  requested_by: string | null;
  policy_hint: string | null;
  status: string;
  decision_brief_json?: unknown;
}): ApprovalRow {
  const action = r.action_label;
  const policy = r.policy_hint ?? "—";
  return {
    id: r.id,
    action,
    requestedBy: r.requested_by ?? "—",
    policy,
    status: r.status as ApprovalRow["status"],
    decisionBrief: parseDecisionBrief(r.decision_brief_json, {
      actionLabel: action,
      policyHint: policy,
    }),
  };
}

export type ListApprovalsParams = {
  userId: string;
  /** When Supabase auth is off, scope queue to this browser session. */
  devTenantId?: string | null;
};

export async function listApprovalsForUser(
  params: ListApprovalsParams | string,
): Promise<ApprovalsListResult> {
  const userId = typeof params === "string" ? params : params.userId;
  const devTenantId =
    typeof params === "string" ? null : (params.devTenantId ?? null);

  if (!hasSupabaseAuth()) {
    if (devTenantId) {
      const { pending, recent } = devListApprovals(devTenantId);
      return { source: "session", pending, recent };
    }
    return { source: "session", pending: [], recent: [] };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: pendData, error: pendErr } = await supabase
      .from("approval_requests")
      .select("id, action_label, requested_by, policy_hint, status, decision_brief_json")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("updated_at", { ascending: false });

    const { data: recentData, error: recentErr } = await supabase
      .from("approval_requests")
      .select("id, action_label, requested_by, policy_hint, status, decision_brief_json")
      .eq("user_id", userId)
      .in("status", ["approved", "denied"])
      .order("updated_at", { ascending: false })
      .limit(20);

    if (pendErr || recentErr) {
      return { source: "database", pending: [], recent: [] };
    }

    const pending = (pendData ?? []).map((r) =>
      mapRow({
        id: r.id as string,
        action_label: r.action_label as string,
        requested_by: r.requested_by as string | null,
        policy_hint: r.policy_hint as string | null,
        status: r.status as string,
        decision_brief_json: r.decision_brief_json,
      }),
    );

    const recent = (recentData ?? []).map((r) =>
      mapRow({
        id: r.id as string,
        action_label: r.action_label as string,
        requested_by: r.requested_by as string | null,
        policy_hint: r.policy_hint as string | null,
        status: r.status as string,
        decision_brief_json: r.decision_brief_json,
      }),
    );

    return { source: "database", pending, recent };
  } catch {
    return { source: "database", pending: [], recent: [] };
  }
}

export async function createApprovalRequest(input: {
  userId: string;
  devTenantId: string | null;
  actionLabel: string;
  requestedBy: string;
  policyHint: string;
}): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const action = input.actionLabel.trim();
  if (!action) {
    return { ok: false, reason: "Describe the change or action that needs approval." };
  }

  const rb = input.requestedBy.trim();
  const pol = input.policyHint.trim();
  const brief = buildDecisionBrief({
    actionLabel: action,
    policyHint: pol,
  });

  if (!hasSupabaseAuth()) {
    const tid = input.devTenantId;
    if (!tid) {
      return { ok: false, reason: "No browser session." };
    }
    const id = devCreateApproval(tid, {
      action,
      requestedBy: rb || "Console",
      policy: pol || "—",
    });
    return { ok: true, id };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("approval_requests")
      .insert({
        user_id: input.userId,
        action_label: action,
        requested_by: rb || null,
        policy_hint: pol || null,
        decision_brief_json: brief,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, reason: error.message };
    }
    if (!data?.id) {
      return { ok: false, reason: "Insert returned no id." };
    }
    return { ok: true, id: data.id as string };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Could not create approval request.",
    };
  }
}
