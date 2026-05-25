import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import { buildControlMonitoringForFramework } from "../lib/compliance/continuous-assessment";
import { complianceControlsForAuditEvent } from "../lib/compliance/map-audit";
import type { ComplianceSummary } from "../lib/compliance/types";
import { inheritBaaHipaaControlIds } from "../lib/third-party-risk/baa-inheritance";
import { inheritControlIdsForVendor } from "../lib/third-party-risk/inheritance";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const hipaa = COMPLIANCE_CONTROLS.filter((c) => c.framework === "hipaa");
assert(hipaa.length === 11, "eleven HIPAA safeguards in catalog");
assert(hipaa.some((c) => c.ref === "164.308(b)(1)"), "BAA safeguard present");

const empty: ComplianceSummary = {
  sinceIso: new Date().toISOString(),
  auditEventsScanned: 0,
  acceptedPolicyCount: 0,
  coveragePercent: 0,
  rows: [],
};
const monitoring = buildControlMonitoringForFramework("hipaa", empty, empty);
assert(monitoring.length === hipaa.length, "monitoring covers HIPAA catalog");

const baaIds = inheritBaaHipaaControlIds();
assert(baaIds.length === hipaa.length, "BAA inherits all HIPAA controls");
const vendorBaa = inheritControlIdsForVendor("high", "healthcare_baa");
assert(vendorBaa.includes("hipaa:164.308b1"), "healthcare BAA vendor gets BAA control");

const incident = complianceControlsForAuditEvent("incident.created");
assert(incident.some((c) => c.framework === "hipaa"), "incidents map to HIPAA");

assert(isPathAllowedForAuditor("/governance/compliance/hipaa"), "auditor can open HIPAA page");

console.log("test-hipaa: all checks passed");
