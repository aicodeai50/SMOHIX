import type { ApprovalRow } from "./types";
import { DEMO_PENDING } from "./demo";

type Bucket = { pending: ApprovalRow[]; recent: ApprovalRow[] };

const byTenant = new Map<string, Bucket>();

function bucket(tenantId: string): Bucket {
  let b = byTenant.get(tenantId);
  if (!b) {
    b = {
      pending: DEMO_PENDING.map((p) => ({ ...p })),
      recent: [],
    };
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
