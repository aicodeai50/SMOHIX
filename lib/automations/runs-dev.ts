export type DryRunRecord = {
  id: string;
  playbookId: string;
  ok: boolean;
  detail: string;
  at: string;
  /** Present when dry-run was tied to an incident (DB + audit context). */
  incidentId?: string | null;
};

const byTenant = new Map<string, DryRunRecord[]>();

function bucket(tid: string): DryRunRecord[] {
  let b = byTenant.get(tid);
  if (!b) {
    b = [];
    byTenant.set(tid, b);
  }
  return b;
}

export function recordDryRun(
  tenantId: string,
  entry: Omit<DryRunRecord, "id" | "at"> & { id?: string },
): DryRunRecord {
  const list = bucket(tenantId);
  const rec: DryRunRecord = {
    id: entry.id ?? `run-${Date.now()}`,
    playbookId: entry.playbookId,
    ok: entry.ok,
    detail: entry.detail,
    at: new Date().toISOString(),
    ...(entry.incidentId != null ? { incidentId: entry.incidentId } : {}),
  };
  list.unshift(rec);
  const trimmed = list.slice(0, 40);
  byTenant.set(tenantId, trimmed);
  return rec;
}

export function listDryRuns(tenantId: string): DryRunRecord[] {
  return [...bucket(tenantId)];
}

export function lastRunLabelForPlaybook(
  tenantId: string,
  playbookId: string,
): string {
  const hit = bucket(tenantId).find((r) => r.playbookId === playbookId);
  if (!hit) {
    return "—";
  }
  const status = hit.ok ? "ok" : "fail";
  const t = new Date(hit.at);
  return `${status} · ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
