export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "investigating" | "mitigated" | "resolved" | "monitoring";

export type IncidentRow = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus | string;
  updated: string;
  /** Present when `services` join is applied (Supabase). */
  serviceName?: string | null;
  /** Responder / team label. */
  ownerHint?: string | null;
  /** Assigned organization member, when the incident is org-scoped. */
  assignedUserId?: string | null;
  /** Linked runbook catalog slug. */
  runbookSlug?: string | null;
  /** Resolved title when `runbookSlug` is set. */
  runbookTitle?: string | null;
};

/** Detail view fields (database incidents). */
export type IncidentDetail = IncidentRow & {
  postmortem: string | null;
  serviceId: string | null;
  legalHold: boolean;
  legalHoldReason: string | null;
  legalHoldSetAt: string | null;
};

export type IncidentsListResult = {
  /** `database` = Supabase `incidents` table; `session` = browser session store (no auth). */
  source: "database" | "session";
  rows: IncidentRow[];
};
