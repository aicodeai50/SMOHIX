import {
  buildAssessmentExceptions,
  buildControlMonitoringForFramework,
  buildDomainSummary,
} from "../lib/compliance/continuous-assessment";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";
import type { ComplianceSummary } from "../lib/compliance/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const emptySummary = (rows: ComplianceSummary["rows"]): ComplianceSummary => ({
  sinceIso: new Date().toISOString(),
  auditEventsScanned: 0,
  acceptedPolicyCount: 0,
  coveragePercent: 0,
  rows,
});

const current = emptySummary([]);
const prior = emptySummary([]);

const isoMonitoring = buildControlMonitoringForFramework("iso27001", current, prior);
assert(isoMonitoring.length === 7, "seven ISO annex A controls in catalog");
assert(isoMonitoring.every((r) => r.ref.startsWith("A.")), "ISO refs use annex A prefix");

const domains = buildDomainSummary(isoMonitoring);
assert(domains.length >= 2, "ISO controls span multiple domains");

const exceptions = buildAssessmentExceptions(isoMonitoring);
assert(exceptions.length === isoMonitoring.length, "all-none window yields gap per control");
assert(exceptions[0]?.domain.length > 0, "exceptions include domain for gap analysis");

assert(isPathAllowedForAuditor("/governance/compliance/iso-assessment"), "auditor can open ISO assessment");

console.log("test-iso-assessment: all checks passed");
