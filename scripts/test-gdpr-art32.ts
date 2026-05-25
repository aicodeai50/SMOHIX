import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import { buildGdprArt32DomainReadiness, dpaPostureFromMonitoring } from "../lib/compliance/gdpr-art32-readiness";
import { buildControlMonitoringForFramework } from "../lib/compliance/continuous-assessment";
import { complianceControlsForAuditEvent } from "../lib/compliance/map-audit";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const gdprControls = COMPLIANCE_CONTROLS.filter((c) => c.framework === "gdpr_art32");
assert(gdprControls.length === 12, "twelve GDPR Article 32 measures in catalog");
assert(gdprControls.every((c) => c.id.startsWith("gdpr_art32:")), "GDPR ids use gdpr_art32 prefix");
assert(gdprControls.some((c) => c.ref === "32-a1"), "encryption measure present");

const empty: ComplianceSummary = {
  sinceIso: new Date().toISOString(),
  auditEventsScanned: 0,
  acceptedPolicyCount: 0,
  coveragePercent: 0,
  rows: [],
};
const monitoring = buildControlMonitoringForFramework("gdpr_art32", empty, empty);
assert(monitoring.length === gdprControls.length, "monitoring covers all Article 32 measures");

const domains = buildGdprArt32DomainReadiness(monitoring);
assert(domains.length === 6, "six measure domains");

const dpa = dpaPostureFromMonitoring(monitoring);
assert(dpa.dpaBand === "At risk", "no evidence yields at-risk DPA band");

const incident = complianceControlsForAuditEvent("incident.created");
assert(incident.some((c) => c.framework === "gdpr_art32" && c.ref === "32-r1"), "incidents map to resilience");

assert(isPathAllowedForAuditor("/governance/compliance/gdpr-art32"), "auditor can open GDPR Article 32 page");

console.log("test-gdpr-art32: all checks passed");
