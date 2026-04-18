export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentRow = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: string;
  updated: string;
};

export type IncidentsListResult = {
  /** `database` = Supabase `incidents` table; `session` = browser session store (no auth). */
  source: "database" | "session";
  rows: IncidentRow[];
};
