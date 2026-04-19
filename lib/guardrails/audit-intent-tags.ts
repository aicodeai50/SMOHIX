/**
 * Human-readable intent tags for audit_log.event_type — makes the log scannable.
 */
export const AUDIT_INTENT_LABELS = {
  manual: "Manual",
  automated: "Automated",
  approved: "Approved",
  system: "System",
} as const;

export type AuditIntentTag = keyof typeof AUDIT_INTENT_LABELS;

export function intentTagsForEventType(eventType: string): AuditIntentTag[] {
  const et = eventType.trim();
  if (et === "billing.subscription_synced") {
    return ["system"];
  }
  if (et === "automation.dry_run") {
    return ["automated"];
  }
  if (et === "approval.approved") {
    return ["approved", "manual"];
  }
  if (et === "approval.denied") {
    return ["manual"];
  }
  if (et === "approval.requested") {
    return ["manual"];
  }
  if (et.startsWith("incident.")) {
    return ["manual"];
  }
  if (et.startsWith("api_key.") || et.startsWith("alert_ingest_token.")) {
    return ["manual"];
  }
  return et ? ["manual"] : [];
}
