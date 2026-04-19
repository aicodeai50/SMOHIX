/**
 * Pulls `incident_id` from audit_log.details when present (automation + incident events).
 */
export function incidentIdFromAuditDetails(
  _eventType: string,
  details: Record<string, unknown> | null,
): string | null {
  if (!details || typeof details !== "object") {
    return null;
  }
  const raw = details.incident_id;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
