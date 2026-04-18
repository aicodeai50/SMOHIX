import type { IncidentRow } from "./types";

/** Placeholder data until `incidents` table is populated (or Supabase is off). */
export const DEMO_INCIDENTS: IncidentRow[] = [
  {
    id: "inc-2041",
    title: "Elevated API latency — us-east",
    severity: "high",
    status: "investigating",
    updated: "2m ago",
  },
  {
    id: "inc-2038",
    title: "Worker queue backlog",
    severity: "medium",
    status: "mitigated",
    updated: "1h ago",
  },
];
