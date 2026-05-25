import type { ComplianceControl } from "@/lib/compliance/types";
import type { AttestationWorkflowStatus } from "@/lib/compliance/attestation/status";

export type AttestationEventType = "owner_assigned" | "due_updated" | "attested" | "note";

export type ControlAttestationRow = {
  id: string;
  orgId: string;
  controlId: string;
  control: ComplianceControl;
  ownerUserId: string | null;
  ownerLabel: string | null;
  dueAt: string;
  attestedAt: string | null;
  attestedBy: string | null;
  attestationNote: string | null;
  status: AttestationWorkflowStatus;
  linkedAuditEvidenceCount: number;
  auditEvidenceHref: string;
};

export type AttestationTrailEvent = {
  id: string;
  eventType: AttestationEventType;
  actorUserId: string;
  details: Record<string, unknown>;
  createdAt: string;
};
