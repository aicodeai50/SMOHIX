import { listAuditEventTypesForCompliance } from "@/lib/audit/data";
import { complianceControlsForAuditEvent } from "@/lib/compliance/map-audit";

const EVIDENCE_WINDOW_DAYS = 30;

function sinceIsoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Count audit events in the compliance window mapped to a control id. */
export async function countLinkedAuditEvidence(
  userId: string,
  controlId: string,
  opts?: { orgId?: string | null },
): Promise<number> {
  const sinceIso = sinceIsoDaysAgo(EVIDENCE_WINDOW_DAYS);
  const rows = await listAuditEventTypesForCompliance(userId, {
    sinceIso,
    orgId: opts?.orgId,
  });
  let count = 0;
  for (const row of rows) {
    const refs = complianceControlsForAuditEvent(String(row.event_type));
    if (refs.some((r) => r.id === controlId)) count += 1;
  }
  return count;
}

export function auditEvidenceDeepLink(controlId: string): string {
  const params = new URLSearchParams({ control: controlId });
  return `/audit?${params.toString()}`;
}
