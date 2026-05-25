export type ComplianceFramework =
  | "soc2"
  | "iso27001"
  | "pcidss"
  | "hipaa"
  | "nist_csf"
  | "cis_v8"
  | "cmmc_l2"
  | "gdpr_art32";

export type ComplianceControl = {
  id: string;
  framework: ComplianceFramework;
  ref: string;
  title: string;
  domain: string;
};

export type ComplianceControlRef = {
  id: string;
  framework: ComplianceFramework;
  ref: string;
};

export type ComplianceCoverageRow = {
  control: ComplianceControl;
  auditEvidenceCount: number;
  policyEvidenceCount: number;
  status: "covered" | "partial" | "none";
};

export type ComplianceSummary = {
  sinceIso: string;
  auditEventsScanned: number;
  acceptedPolicyCount: number;
  coveragePercent: number;
  rows: ComplianceCoverageRow[];
};
