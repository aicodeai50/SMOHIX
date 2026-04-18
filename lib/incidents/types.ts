export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentRow = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: string;
  updated: string;
};

export type IncidentsListResult = {
  source: "database" | "demo";
  rows: IncidentRow[];
};
