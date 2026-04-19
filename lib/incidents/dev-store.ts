import { isRunbookSlugValid, runbookTitleForSlug } from "@/lib/runbooks/catalog";
import { formatIncidentRelative } from "@/lib/incidents/format";
import { appendDevIncidentTimelineEvent } from "@/lib/incidents/timeline-dev";
import type { IncidentRow, IncidentSeverity } from "@/lib/incidents/types";

type Stored = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: string;
  updatedAt: string;
  ownerHint?: string;
  runbookSlug?: string;
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
  const slug = s.runbookSlug?.trim() || undefined;
  return {
    id: s.id,
    title: s.title,
    severity: s.severity,
    status: s.status,
    updated: formatIncidentRelative(s.updatedAt),
    ownerHint: s.ownerHint?.trim() || undefined,
    runbookSlug: slug,
    runbookTitle: slug ? runbookTitleForSlug(slug) ?? undefined : undefined,
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
  input: {
    title: string;
    severity: IncidentSeverity;
    status: string;
    ownerHint?: string | null;
    runbookSlug?: string | null;
  },
): string {
  const id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const rb =
    typeof input.runbookSlug === "string" && input.runbookSlug.trim() && isRunbookSlugValid(input.runbookSlug.trim())
      ? input.runbookSlug.trim()
      : undefined;
  const owner =
    typeof input.ownerHint === "string" && input.ownerHint.trim()
      ? input.ownerHint.trim().slice(0, 200)
      : undefined;
  const list = bucket(tenantId);
  list.unshift({
    id,
    title: input.title.trim(),
    severity: input.severity,
    status: input.status.trim() || "investigating",
    updatedAt: now,
    ...(owner ? { ownerHint: owner } : {}),
    ...(rb ? { runbookSlug: rb } : {}),
  });
  byTenant.set(tenantId, list.slice(0, 50));
  appendDevIncidentTimelineEvent(
    tenantId,
    id,
    `Opened · ${input.status.trim() || "investigating"} · severity ${input.severity}`,
  );
  return id;
}

export function updateDevIncidentContext(
  tenantId: string,
  id: string,
  input: { ownerHint: string | null; runbookSlug: string | null },
): boolean {
  const slugRaw = input.runbookSlug?.trim() || null;
  if (slugRaw && !isRunbookSlugValid(slugRaw)) {
    return false;
  }
  const list = bucket(tenantId);
  const hit = list.find((s) => s.id === id);
  if (!hit) return false;
  hit.ownerHint = input.ownerHint?.trim().slice(0, 200) || undefined;
  hit.runbookSlug = slugRaw || undefined;
  hit.updatedAt = new Date().toISOString();
  list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const parts: string[] = [];
  if (hit.ownerHint) parts.push(`owner ${hit.ownerHint}`);
  if (hit.runbookSlug) parts.push(`runbook ${hit.runbookSlug}`);
  appendDevIncidentTimelineEvent(
    tenantId,
    id,
    parts.length ? `Context · ${parts.join(" · ")}` : "Context cleared",
  );
  return true;
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
