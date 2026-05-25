import {
  buildCompliancePostureScorePackFromParts,
  buildPosturePillars,
  computeAttestationClosurePercent,
  computeGapClosurePercent,
  computeUnifiedPostureScore,
  computeVendorReadinessPercent,
  scoreToGrade,
} from "../lib/compliance/compliance-posture-score";
import type { FrameworkBaselineRow } from "../lib/compliance/baseline-comparison";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(computeAttestationClosurePercent({ total: 10, attested: 8 }) === 80, "attestation closure");
assert(computeGapClosurePercent({ open: 1, inProgress: 1, resolved: 2, dismissed: 0 }) === 50, "gap closure");
assert(computeVendorReadinessPercent([{ readinessPercent: 60 }, { readinessPercent: 80 }]) === 70, "vendor avg");

const pillars = buildPosturePillars({
  readiness: 75,
  attestationClosure: 80,
  vendorReadiness: 70,
  gapClosure: 90,
  riskMitigation: 65,
  attestationOverdue: 0,
  openGaps: 0,
  vendorCount: 2,
});
const score = computeUnifiedPostureScore(pillars);
assert(score > 70 && score <= 100, "unified score in range");
assert(scoreToGrade(88) === "A", "grade A");
assert(scoreToGrade(45) === "D", "grade D");

const frameworkRows = [
  {
    framework: "soc2",
    label: "SOC 2",
    consolePath: "/governance/compliance/type-ii",
    controlCount: 10,
    readinessPercent: 50,
    priorReadinessPercent: 45,
    readinessDelta: 5,
    covered: 5,
    partial: 2,
    none: 3,
    improved: 2,
    unchanged: 5,
    regressed: 1,
    exceptionCount: 3,
    weakestDomain: null,
    auditEventsScanned: 0,
    acceptedPolicyCount: 0,
  },
] satisfies FrameworkBaselineRow[];

const pack = buildCompliancePostureScorePackFromParts({
  orgId: "org-1",
  periodDays: 30,
  programReadinessPercent: 75,
  attestationClosurePercent: 80,
  vendorReadinessPercent: 70,
  gapClosurePercent: 90,
  overallRiskScore: 35,
  readinessTrendDelta: 5,
  attestationOverdue: 1,
  openGapRemediations: 2,
  frameworkRows,
  criticalVendorCount: 0,
  vendorCount: 1,
});

assert(pack.pillars.length === 5, "five pillars");
assert(pack.drivers.length > 0, "drivers when weak framework");
assert(pack.postureScore === score, "pack score matches");

assert(isPathAllowedForAuditor("/governance/compliance/posture-score"), "auditor path");

console.log("test-compliance-posture-score: all checks passed");
