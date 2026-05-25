import type { ComplianceControl } from "@/lib/compliance/types";
import type { AttestationWorkflowStatus } from "@/lib/compliance/attestation/status";

export type VendorCategory =
  | "saas"
  | "cloud"
  | "security"
  | "data_processor"
  | "consulting"
  | "healthcare_baa"
  | "other";

export type VendorRiskTier = "low" | "medium" | "high" | "critical";

export type VendorStatus = "active" | "review" | "offboarding";

export type VendorControlSource = "inherited" | "explicit";

export type VendorControlRow = {
  controlId: string;
  control: ComplianceControl;
  source: VendorControlSource;
  attestationStatus: AttestationWorkflowStatus | null;
  linkedAuditEvidenceCount: number;
  auditEvidenceHref: string;
};

export type ThirdPartyVendorRow = {
  id: string;
  orgId: string;
  name: string;
  category: VendorCategory;
  riskTier: VendorRiskTier;
  status: VendorStatus;
  reviewDueAt: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
  controls: VendorControlRow[];
  controlCount: number;
  attestedControlCount: number;
  reusedEvidenceCount: number;
  readinessPercent: number;
};
