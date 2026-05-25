import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { buildDecisionBrief, parseDecisionBrief } from "@/lib/decision-intelligence";
import { canDecideApproval, type OrgRole } from "@/lib/org/roles";

import { devCreateApproval, devListApprovals } from "./dev-store";
import type { ApprovalRow, ApprovalsListResult } from "./types";

function mapRow(
  r: {
    id: string;
    action_label: string;
    requested_by: string | null;
    policy_hint: string | null;
    status: string;
    decision_brief_json?: unknown;
    requester_id?: string | null;
    user_id?: string | null;
  },
  actor?: { userId: string; orgRole: OrgRole | null },
): ApprovalRow {
  const action = r.action_label;
  const policy = r.policy_hint ?? "—";
  const decisionBrief = parseDecisionBrief(r.decision_brief_json, {
    actionLabel: action,
    policyHint: policy,
  });
  const requesterId = (r.requester_id as string | null) ?? (r.user_id as string | null) ?? null;

  let canDecide = true;
  let decideBlockedReason: string | null = null;

  if (actor && r.status === "pending") {
    if (actor.orgRole) {
      if (!canDecideApproval(actor.orgRole, decisionBrief.riskScore)) {
        canDecide = false;
        decideBlockedReason =
          actor.orgRole === "security_reviewer"
            ? "Security reviewers decide high-risk items only (score 70+)."
            : "Your org role cannot approve requests.";
      } else if (requesterId && requesterId === actor.userId) {
        canDecide = false;
        decideBlockedReason = "Delegated approvers cannot approve their own request.";
      }
    } else if (requesterId && requesterId === actor.userId) {
      canDecide = true;
    }
  }

  return {
    id: r.id,
    action,
    requestedBy: r.requested_by ?? "—",
    policy,
    status: r.status as ApprovalRow["status"],
    decisionBrief,
    requesterId,
    canDecide,
    decideBlockedReason,
  };
}

export type ListApprovalsParams = {
  userId: string;
  /** When Supabase auth is off, scope queue to this browser session. */
  devTenantId?: string | null;
  orgId?: string | null;
  orgRole?: OrgRole | null;
};

export async function listApprovalsForUser(
  params: ListApprovalsParams | string,
): Promise<ApprovalsListResult> {
  const normalized: ListApprovalsParams =
    typeof params === "string" ? { userId: params } : params;
  const userId = normalized.userId;
  const devTenantId = normalized.devTenantId ?? null;
  const orgId = normalized.orgId ?? null;
  const actor = { userId, orgRole: normalized.orgRole ?? null };

  if (!hasSupabaseAuth()) {
    if (devTenantId) {
      const { pending, recent } = devListApprovals(devTenantId);
      return {
        source: "session",
        pending: pending.map((p) => ({
          ...p,
          requesterId: null,
          canDecide: true,
          decideBlockedReason: null,
        })),
        recent: recent.map((p) => ({
          ...p,
          requesterId: null,
          canDecide: false,
          decideBlockedReason: null,
        })),
      };
    }
    return { source: "session", pending: [], recent: [] };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const selectCols =
      "id, action_label, requested_by, policy_hint, status, decision_brief_json, requester_id, user_id, org_id";

    const scopeFilter = orgId
      ? `org_id.eq.${orgId},and(org_id.is.null,user_id.eq.${userId})`
      : null;

    let pendingQuery = supabase
      .from("approval_requests")
      .select(selectCols)
      .eq("status", "pending")
      .order("updated_at", { ascending: false });

    let recentQuery = supabase
      .from("approval_requests")
      .select(selectCols)
      .in("status", ["approved", "denied"])
      .order("updated_at", { ascending: false })
      .limit(20);

    if (scopeFilter) {
      pendingQuery = pendingQuery.or(scopeFilter);
      recentQuery = recentQuery.or(scopeFilter);
    } else {
      pendingQuery = pendingQuery.eq("user_id", userId);
      recentQuery = recentQuery.eq("user_id", userId);
    }

    const [{ data: pendData, error: pendErr }, { data: recentData, error: recentErr }] =
      await Promise.all([pendingQuery, recentQuery]);

    if (pendErr || recentErr) {
      return { source: "database", pending: [], recent: [] };
    }

    const pending = (pendData ?? []).map((r) =>
      mapRow(
        {
          id: r.id as string,
          action_label: r.action_label as string,
          requested_by: r.requested_by as string | null,
          policy_hint: r.policy_hint as string | null,
          status: r.status as string,
          decision_brief_json: r.decision_brief_json,
          requester_id: r.requester_id as string | null,
          user_id: r.user_id as string | null,
        },
        actor,
      ),
    );

    const recent = (recentData ?? []).map((r) =>
      mapRow(
        {
          id: r.id as string,
          action_label: r.action_label as string,
          requested_by: r.requested_by as string | null,
          policy_hint: r.policy_hint as string | null,
          status: r.status as string,
          decision_brief_json: r.decision_brief_json,
          requester_id: r.requester_id as string | null,
          user_id: r.user_id as string | null,
        },
        actor,
      ),
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
  orgId?: string | null;
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
    const row: Record<string, unknown> = {
      user_id: input.userId,
      action_label: action,
      requested_by: rb || null,
      policy_hint: pol || null,
      decision_brief_json: brief,
      requester_id: input.userId,
    };
    if (input.orgId) {
      row.org_id = input.orgId;
    }

    const { data, error } = await supabase.from("approval_requests").insert(row).select("id").single();

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
