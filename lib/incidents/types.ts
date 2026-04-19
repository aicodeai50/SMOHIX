export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentRow = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: string;
  updated: string;
  /** Present when `services` join is applied (Supabase). */
  serviceName?: string | null;
  /** Responder / team label. */
  ownerHint?: string | null;
  /** Linked runbook catalog slug. */
  runbookSlug?: string | null;
  /** Resolved title when `runbookSlug` is set. */
  runbookTitle?: string | null;
};

/** Detail view fields (database incidents). */
export type IncidentDetail = IncidentRow & {
  postmortem: string | null;
  serviceId: string | null;
};

export type IncidentsListResult = {
  /** `database` = Supabase `incidents` table; `session` = browser session store (no auth). */
  source: "database" | "session";
  rows: IncidentRow[];
};
