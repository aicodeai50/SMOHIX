import {
  buildOrgRetentionPolicy,
  effectiveRetentionDays,
  TIER_RETENTION_LIMITS,
  validateRetentionUpdate,
} from "../lib/retention/policy";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const standardPolicy = buildOrgRetentionPolicy({ deploymentTier: "standard" });
assert(standardPolicy.auditRetentionDays === 90, "standard default audit");
assert(standardPolicy.incidentRetentionDays === 90, "standard default incident");

const fedrampOverride = buildOrgRetentionPolicy({
  deploymentTier: "fedramp_ready",
  auditOverrideDays: 730,
  incidentOverrideDays: null,
});
assert(fedrampOverride.auditRetentionDays === 730, "override audit days");
assert(fedrampOverride.incidentRetentionDays === 730, "fedramp default incident when null override");

assert(
  effectiveRetentionDays("regulated", "audit", null) === TIER_RETENTION_LIMITS.regulated.defaultAuditDays,
  "regulated tier fallback",
);

const tooLong = validateRetentionUpdate("standard", {
  auditRetentionDays: 999,
  incidentRetentionDays: null,
});
assert(!tooLong.ok, "standard tier caps audit retention");

const ok = validateRetentionUpdate("fedramp_ready", {
  auditRetentionDays: 2555,
  incidentRetentionDays: 365,
});
assert(ok.ok, "fedramp allows long audit retention");

console.log("test-retention-policy: all checks passed");
