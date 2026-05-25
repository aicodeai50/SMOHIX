import {
  applyAuditRoleEventFilter,
  auditEventPrefixesForRole,
  canExportOrgAuditLog,
  eventTypeMatchesRolePrefixes,
} from "../lib/audit/role-filter";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(auditEventPrefixesForRole("owner") === null, "owner sees all events");
assert(Boolean(auditEventPrefixesForRole("viewer")?.includes("incident.")), "viewer sees incidents");
assert(
  eventTypeMatchesRolePrefixes("incident.status_updated", "viewer"),
  "viewer matches incident events",
);
assert(
  !eventTypeMatchesRolePrefixes("billing.subscription_synced", "viewer"),
  "viewer hides billing",
);
assert(canExportOrgAuditLog("viewer") === false, "viewer cannot export");
assert(canExportOrgAuditLog("approver") === true, "approver can export");

const mockQuery = {
  orCalls: [] as string[],
  ilikeCalls: [] as string[],
  or(filter: string) {
    this.orCalls.push(filter);
    return this;
  },
  ilike(_col: string, pattern: string) {
    this.ilikeCalls.push(pattern);
    return this;
  },
};

applyAuditRoleEventFilter(mockQuery, "viewer");
assert(mockQuery.orCalls.length + mockQuery.ilikeCalls.length > 0, "role filter applied");

console.log("test-org-audit-scope: all checks passed");
