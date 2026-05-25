export type LegalHoldIncidentRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  updatedAt: string;
  legalHoldReason: string | null;
  legalHoldSetAt: string | null;
  legalHoldSetBy: string | null;
};

export type LegalHoldSummary = {
  incidentCount: number;
  auditHoldCount: number;
  incidents: LegalHoldIncidentRow[];
};
