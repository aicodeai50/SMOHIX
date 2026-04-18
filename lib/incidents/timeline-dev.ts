export type DevTimelineEvent = { at: string; label: string };

const byTenant = new Map<string, Map<string, DevTimelineEvent[]>>();

function eventsFor(tenantId: string, incidentId: string): DevTimelineEvent[] {
  let t = byTenant.get(tenantId);
  if (!t) {
    t = new Map();
    byTenant.set(tenantId, t);
  }
  let list = t.get(incidentId);
  if (!list) {
    list = [];
    t.set(incidentId, list);
  }
  return list;
}

export function appendDevIncidentTimelineEvent(
  tenantId: string,
  incidentId: string,
  label: string,
): void {
  const list = eventsFor(tenantId, incidentId);
  list.unshift({
    at: new Date().toISOString(),
    label,
  });
  const trimmed = list.slice(0, 40);
  const t = byTenant.get(tenantId)!;
  t.set(incidentId, trimmed);
}

export function listDevIncidentTimeline(
  tenantId: string,
  incidentId: string,
): DevTimelineEvent[] {
  const t = byTenant.get(tenantId);
  if (!t) return [];
  const list = t.get(incidentId);
  return list ? [...list] : [];
}
