export type AuditDisplayRow = {
  id: string;
  ts: string;
  actor: string;
  action: string;
  target: string;
  outcome: string;
};

export type AuditListResult =
  | { source: "demo"; rows: AuditDisplayRow[] }
  | { source: "database"; rows: AuditDisplayRow[] };
