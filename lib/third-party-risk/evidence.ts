import {
  auditEvidenceDeepLink,
  countLinkedAuditEvidence,
} from "@/lib/compliance/attestation/evidence";
import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import type { AttestationWorkflowStatus } from "@/lib/compliance/attestation/status";
import { getComplianceControl } from "@/lib/compliance/catalog";
import type { VendorControlRow } from "@/lib/third-party-risk/types";

export async function buildVendorControlEvidenceRows(
  userId: string,
  orgId: string,
  controlIds: { controlId: string; source: VendorControlRow["source"] }[],
): Promise<VendorControlRow[]> {
  const attestationBoard = await listControlAttestationBoard(userId, orgId);
  const attestationByControl = new Map(
    attestationBoard.map((a) => [a.controlId, a.status] as const),
  );

  const rows: VendorControlRow[] = [];
  for (const { controlId, source } of controlIds) {
    const control = getComplianceControl(controlId);
    if (!control) continue;

    const linkedAuditEvidenceCount = await countLinkedAuditEvidence(userId, controlId, {
      orgId,
    });

    rows.push({
      controlId,
      control,
      source,
      attestationStatus: attestationByControl.get(controlId) ?? null,
      linkedAuditEvidenceCount,
      auditEvidenceHref: auditEvidenceDeepLink(controlId),
    });
  }

  return rows.sort((a, b) => a.control.ref.localeCompare(b.control.ref));
}

export function summarizeVendorEvidence(controls: VendorControlRow[]): {
  attestedControlCount: number;
  reusedEvidenceCount: number;
  readinessPercent: number;
} {
  const attestedControlCount = controls.filter((c) => c.attestationStatus === "attested").length;
  const reusedEvidenceCount = controls.reduce((sum, c) => sum + c.linkedAuditEvidenceCount, 0);
  const withEvidence = controls.filter((c) => c.linkedAuditEvidenceCount > 0).length;
  const readinessPercent =
    controls.length > 0 ? Math.round((withEvidence / controls.length) * 1000) / 10 : 0;
  return { attestedControlCount, reusedEvidenceCount, readinessPercent };
}

export function attestationStatusLabel(status: AttestationWorkflowStatus | null): string {
  if (!status) return "not tracked";
  return status;
}
