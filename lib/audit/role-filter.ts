import type { OrgRole } from "@/lib/org/roles";

/** Event-type prefixes visible per org role. null = unrestricted (owner/admin/security reviewer). */
export function auditEventPrefixesForRole(role: OrgRole | null | undefined): string[] | null {
  if (!role) return null;
  switch (role) {
    case "owner":
    case "admin":
    case "security_reviewer":
      return null;
    case "approver":
      return [
        "approval.",
        "automation.",
        "incident.",
        "governance.",
        "policy.",
        "slack.",
      ];
    case "operator":
      return ["automation.", "incident.", "slack.", "api_key.", "alert_ingest"];
    case "viewer":
      return [
        "incident.",
        "approval.",
        "governance.",
        "policy.",
        "automation.remediation",
        "automation.execution",
        "automation.dry_run",
      ];
    default:
      return ["incident."];
  }
}

export function canExportOrgAuditLog(role: OrgRole | null | undefined): boolean {
  if (!role) return true;
  return role === "owner" || role === "admin" || role === "security_reviewer" || role === "approver";
}

export function auditRoleFilterLabel(role: OrgRole | null | undefined): string | null {
  const prefixes = auditEventPrefixesForRole(role);
  if (!prefixes) return null;
  return `Showing ${prefixes.length} event categories for your ${role?.replace("_", " ")} role.`;
}

type OrQuery<T> = { or: (filter: string) => T };

/** Apply PostgREST OR filter for role-visible event_type prefixes. */
export function applyAuditRoleEventFilter<T extends OrQuery<T>>(
  query: T,
  role: OrgRole | null | undefined,
): T {
  const prefixes = auditEventPrefixesForRole(role);
  if (!prefixes || prefixes.length === 0) return query;
  if (prefixes.length === 1) {
    return (query as T & { ilike: (col: string, pattern: string) => T }).ilike(
      "event_type",
      `${prefixes[0]}%`,
    );
  }
  const filter = prefixes.map((p) => `event_type.ilike.${p}%`).join(",");
  return query.or(filter);
}

export function eventTypeMatchesRolePrefixes(eventType: string, role: OrgRole | null | undefined): boolean {
  const prefixes = auditEventPrefixesForRole(role);
  if (!prefixes) return true;
  return prefixes.some((p) => eventType.startsWith(p));
}
