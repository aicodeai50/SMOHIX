/**
 * Soft cross-links for the operations workflow without schema migrations.
 * Approvals store incident context in policy_hint / decision_brief_json conventions.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const INCIDENT_TOKEN_RE =
  /(?:^|[\s|])incident:([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:$|[\s|])/i;

export function isIncidentUuid(value: string | null | undefined): boolean {
  return Boolean(value && UUID_RE.test(value.trim()));
}

/** Extract incident id from policy hint, action label, or brief JSON. */
export function extractIncidentIdFromApprovalContext(input: {
  policyHint?: string | null;
  actionLabel?: string | null;
  decisionBriefJson?: unknown;
}): string | null {
  const fromBrief = extractFromBrief(input.decisionBriefJson);
  if (fromBrief) return fromBrief;

  for (const raw of [input.policyHint, input.actionLabel]) {
    if (!raw) continue;
    const match = raw.match(INCIDENT_TOKEN_RE);
    if (match?.[1] && isIncidentUuid(match[1])) return match[1].toLowerCase();
  }
  return null;
}

function extractFromBrief(brief: unknown): string | null {
  if (!brief || typeof brief !== "object") return null;
  const record = brief as Record<string, unknown>;
  const candidate = record.incident_id ?? record.incidentId;
  if (typeof candidate === "string" && isIncidentUuid(candidate)) {
    return candidate.trim().toLowerCase();
  }
  return null;
}

/** Append a stable incident token to a policy hint without breaking policy keywords. */
export function attachIncidentTokenToPolicyHint(
  policyHint: string,
  incidentId: string,
): string {
  const id = incidentId.trim();
  if (!isIncidentUuid(id)) return policyHint.trim();
  const base = policyHint.trim();
  if (extractIncidentIdFromApprovalContext({ policyHint: base })) {
    return base;
  }
  const token = `incident:${id.toLowerCase()}`;
  return base ? `${base} | ${token}` : token;
}

/** Merge incident_id into a decision brief object for storage (non-schema field). */
export function withIncidentIdOnBrief<T extends Record<string, unknown>>(
  brief: T,
  incidentId: string | null | undefined,
): T & { incident_id?: string } {
  if (!incidentId || !isIncidentUuid(incidentId)) return brief;
  return { ...brief, incident_id: incidentId.trim().toLowerCase() };
}

export function incidentHref(incidentId: string): string {
  return `/incidents/${encodeURIComponent(incidentId)}`;
}

export function approvalsHrefForIncident(incidentId: string): string {
  return `/approvals?incident=${encodeURIComponent(incidentId)}`;
}

export function automationsHrefForIncident(incidentId: string): string {
  return `/automations?incident=${encodeURIComponent(incidentId)}`;
}

export function copilotHrefForIncident(incidentId: string): string {
  return `/copilot?incident=${encodeURIComponent(incidentId)}`;
}

export function newIncidentHrefForService(
  serviceId: string,
  opts?: { severity?: string; title?: string },
): string {
  const params = new URLSearchParams();
  params.set("service_id", serviceId);
  if (opts?.severity) params.set("severity", opts.severity);
  if (opts?.title) params.set("title", opts.title);
  return `/incidents/new?${params.toString()}`;
}

export function servicesHrefForService(serviceId: string): string {
  return `/services#service-${encodeURIComponent(serviceId)}`;
}
