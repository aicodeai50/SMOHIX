import type { ApprovalRow } from "./types";
import { buildDecisionBrief } from "@/lib/decision-intelligence";
import { extractIncidentIdFromApprovalContext } from "@/lib/workflow/incident-links";

type Bucket = { pending: ApprovalRow[]; recent: ApprovalRow[] };

const byTenant = new Map<string, Bucket>();

function bucket(tenantId: string): Bucket {
  let b = byTenant.get(tenantId);
  if (!b) {
    b = { pending: [], recent: [] };
    byTenant.set(tenantId, b);
  }
  return b;
}

export function devListApprovals(tenantId: string): { pending: ApprovalRow[]; recent: ApprovalRow[] } {
  const b = bucket(tenantId);
  return {
    pending: b.pending.map((p) => ({ ...p })),
    recent: b.recent.map((p) => ({ ...p })),
  };
}

export function devCreateApproval(
  tenantId: string,
  input: { action: string; requestedBy: string; policy: string },
): string {
  const id = `dev-apr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const b = bucket(tenantId);
  const linkedIncidentId = extractIncidentIdFromApprovalContext({
    policyHint: input.policy,
    actionLabel: input.action,
  });
  b.pending.unshift({
    id,
    action: input.action,
    requestedBy: input.requestedBy,
    policy: input.policy,
    status: "pending",
    decisionBrief: buildDecisionBrief({
      actionLabel: input.action,
      policyHint: input.policy,
    }),
    linkedIncidentId,
    requesterId: null,
    canDecide: true,
    decideBlockedReason: null,
  });
  b.pending = b.pending.slice(0, 50);
  return id;
}

export function devDecideApproval(
  tenantId: string,
  id: string,
  decision: "approved" | "denied",
): { ok: true } | { ok: false; reason: string } {
  const b = bucket(tenantId);
  const idx = b.pending.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { ok: false, reason: "not_found" };
  }
  const [row] = b.pending.splice(idx, 1);
  b.recent.unshift({
    ...row,
    status: decision,
  });
  b.recent = b.recent.slice(0, 30);
  return { ok: true };
}
