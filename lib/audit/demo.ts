import type { AuditDisplayRow } from "./types";

export const DEMO_AUDIT: AuditDisplayRow[] = [
  {
    id: "demo-1",
    ts: "2026-04-17T18:02:11.000Z",
    actor: "system",
    action: "dry_run.automation",
    target: "restart_stuck_workers · staging",
    outcome: "success",
  },
  {
    id: "demo-2",
    ts: "2026-04-17T18:01:02.000Z",
    actor: "sre@team",
    action: "approval.requested",
    target: "scale_api_tier · prod",
    outcome: "pending",
  },
];
