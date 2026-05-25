import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildCmmcFamilyReadiness,
  sprsPostureFromScore,
  sprsScoreFromReadiness,
} from "../lib/compliance/cmmc-l2-sprs";
import { buildControlMonitoringForFramework } from "../lib/compliance/continuous-assessment";
import { complianceControlsForAuditEvent } from "../lib/compliance/map-audit";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const cmmcControls = COMPLIANCE_CONTROLS.filter((c) => c.framework === "cmmc_l2");
assert(cmmcControls.length === 12, "twelve CMMC L2 practices in catalog");
assert(cmmcControls.every((c) => c.id.startsWith("cmmc_l2:")), "CMMC ids use cmmc_l2 prefix");
assert(cmmcControls.some((c) => c.ref === "3.1.1"), "AC practice present");

assert(sprsScoreFromReadiness(100) === 110, "full readiness maps to SPRS 110");
assert(sprsPostureFromScore(95).sprsBand === "Strong", "high score is Strong band");

const empty: ComplianceSummary = {
  sinceIso: new Date().toISOString(),
  auditEventsScanned: 0,
  acceptedPolicyCount: 0,
  coveragePercent: 0,
  rows: [],
};
const monitoring = buildControlMonitoringForFramework("cmmc_l2", empty, empty);
assert(monitoring.length === cmmcControls.length, "monitoring covers all CMMC practices");

const families = buildCmmcFamilyReadiness(monitoring);
assert(families.length >= 4, "multiple 800-171 families represented");

const incident = complianceControlsForAuditEvent("incident.created");
assert(incident.some((c) => c.framework === "cmmc_l2" && c.ref === "3.6.1"), "incidents map to IR practice");

assert(isPathAllowedForAuditor("/governance/compliance/cmmc-l2"), "auditor can open CMMC L2 page");

console.log("test-cmmc-l2: all checks passed");
