import type { AuditIntentTag } from "@/lib/guardrails/audit-intent-tags";

export type AuditDisplayRow = {
  id: string;
  ts: string;
  actor: string;
  action: string;
  target: string;
  outcome: string;
  tags: AuditIntentTag[];
};

export type AuditListResult =
  | { source: "session"; rows: AuditDisplayRow[] }
  | { source: "database"; rows: AuditDisplayRow[] };
