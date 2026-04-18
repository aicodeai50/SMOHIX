import { formatIncidentRelative } from "@/lib/incidents/format";
import { appendDevIncidentTimelineEvent } from "@/lib/incidents/timeline-dev";
import type { IncidentRow, IncidentSeverity } from "@/lib/incidents/types";

type Stored = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: string;
  updatedAt: string;
};

const byTenant = new Map<string, Stored[]>();

function bucket(tid: string): Stored[] {
  let b = byTenant.get(tid);
  if (!b) {
    b = [];
    byTenant.set(tid, b);
  }
  return b;
}

function toRow(s: Stored): IncidentRow {
  return {
    id: s.id,
    title: s.title,
    severity: s.severity,
    status: s.status,
    updated: formatIncidentRelative(s.updatedAt),
  };
}

export function listDevIncidents(tenantId: string): IncidentRow[] {
  return bucket(tenantId).map(toRow);
}

export function getDevIncident(tenantId: string, id: string): IncidentRow | null {
  const hit = bucket(tenantId).find((s) => s.id === id);
  return hit ? toRow(hit) : null;
}

export function recordDevIncident(
  tenantId: string,
  input: { title: string; severity: IncidentSeverity; status: string },
): string {
  const id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const list = bucket(tenantId);
  list.unshift({
    id,
    title: input.title.trim(),
    severity: input.severity,
    status: input.status.trim() || "investigating",
    updatedAt: now,
  });
  byTenant.set(tenantId, list.slice(0, 50));
  appendDevIncidentTimelineEvent(
    tenantId,
    id,
    `Opened · ${input.status.trim() || "investigating"} · severity ${input.severity}`,
  );
  return id;
}

export function updateDevIncidentStatus(
  tenantId: string,
  id: string,
  status: string,
): boolean {
  const list = bucket(tenantId);
  const hit = list.find((s) => s.id === id);
  if (!hit) return false;
  hit.status = status;
  hit.updatedAt = new Date().toISOString();
  list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  appendDevIncidentTimelineEvent(tenantId, id, `Status updated to ${status}`);
  return true;
}
