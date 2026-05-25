import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import { buildControlMonitoringForFramework } from "../lib/compliance/continuous-assessment";
import { complianceControlsForAuditEvent } from "../lib/compliance/map-audit";
import {
  maturityTierFromReadiness,
  NIST_CSF_TIER_LABELS,
} from "../lib/compliance/nist-csf-maturity";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const nistControls = COMPLIANCE_CONTROLS.filter((c) => c.framework === "nist_csf");
assert(nistControls.length === 12, "twelve NIST CSF outcomes in catalog");
assert(nistControls.every((c) => c.id.startsWith("nist_csf:")), "NIST ids use nist_csf prefix");
assert(
  nistControls.some((c) => c.domain === "Govern" && c.ref === "GV.OC-01"),
  "Govern outcome present",
);

assert(maturityTierFromReadiness(0) === 1, "zero readiness is tier 1");
assert(maturityTierFromReadiness(80) === 4, "high readiness is tier 4");
assert(NIST_CSF_TIER_LABELS[3] === "Tier 3 — Repeatable", "tier labels defined");

const empty: ComplianceSummary = {
  sinceIso: new Date().toISOString(),
  auditEventsScanned: 0,
  acceptedPolicyCount: 0,
  coveragePercent: 0,
  rows: [],
};
const monitoring = buildControlMonitoringForFramework("nist_csf", empty, empty);
assert(monitoring.length === nistControls.length, "monitoring covers all NIST controls");

const incident = complianceControlsForAuditEvent("incident.created");
assert(incident.some((c) => c.framework === "nist_csf" && c.ref === "RS.MA-01"), "incidents map to Respond");

const policy = complianceControlsForAuditEvent("policy.suggestion_accepted");
assert(policy.some((c) => c.framework === "nist_csf" && c.ref === "GV.PO-01"), "policies map to Govern");

assert(isPathAllowedForAuditor("/governance/compliance/nist-csf"), "auditor can open NIST CSF page");

console.log("test-nist-csf: all checks passed");
