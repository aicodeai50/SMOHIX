import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import { buildCisIgReadiness, overallIgPostureFromGroups } from "../lib/compliance/cis-v8-ig-readiness";
import { buildControlMonitoringForFramework } from "../lib/compliance/continuous-assessment";
import { complianceControlsForAuditEvent } from "../lib/compliance/map-audit";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const cisControls = COMPLIANCE_CONTROLS.filter((c) => c.framework === "cis_v8");
assert(cisControls.length === 12, "twelve CIS v8 safeguards in catalog");
assert(cisControls.every((c) => c.id.startsWith("cis_v8:")), "CIS ids use cis_v8 prefix");
assert(cisControls.filter((c) => c.domain === "IG1").length === 4, "four IG1 safeguards");
assert(cisControls.filter((c) => c.domain === "IG3").length === 4, "four IG3 safeguards");

const empty: ComplianceSummary = {
  sinceIso: new Date().toISOString(),
  auditEventsScanned: 0,
  acceptedPolicyCount: 0,
  coveragePercent: 0,
  rows: [],
};
const monitoring = buildControlMonitoringForFramework("cis_v8", empty, empty);
assert(monitoring.length === cisControls.length, "monitoring covers all CIS controls");

const ig = buildCisIgReadiness(monitoring);
assert(ig.length === 3, "three implementation groups");
const posture = overallIgPostureFromGroups(
  ig.map((g) => ({ ...g, readinessPercent: g.implementationGroup === "IG1" ? 80 : 10 })),
);
assert(posture.attainedIg === "IG1", "IG1 met threshold yields IG1 posture");

const incident = complianceControlsForAuditEvent("incident.created");
assert(incident.some((c) => c.framework === "cis_v8" && c.ref === "17.1"), "incidents map to CIS 17.1");

assert(isPathAllowedForAuditor("/governance/compliance/cis-v8"), "auditor can open CIS v8 page");

console.log("test-cis-v8: all checks passed");
