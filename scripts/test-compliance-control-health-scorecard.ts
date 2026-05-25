import {
  buildComplianceControlHealthScorecardFromParts,
  buildHealthMetricRows,
  buildScorecardLeadershipActions,
  computeCompositeHealthScore,
  computeVendorHealthScore,
  scoreToHealthStatus,
} from "../lib/compliance/compliance-control-health-scorecard";
import { buildCompliancePostureScorePackFromParts } from "../lib/compliance/compliance-posture-score";
import { buildInheritedControlCoverageGapPackFromVendors } from "../lib/compliance/inherited-control-coverage-gaps";
import type { FrameworkBaselineRow } from "../lib/compliance/baseline-comparison";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(scoreToHealthStatus(80) === "healthy", "healthy band");
assert(scoreToHealthStatus(60) === "watch", "watch band");
assert(scoreToHealthStatus(40) === "critical", "critical band");

assert(computeVendorHealthScore({
  vendorReadinessPercent: 80,
  vendorCount: 4,
  vendorsWithGaps: 1,
  criticalVendorGapCount: 0,
}) > 70, "vendor health with light gaps");

assert(
  computeVendorHealthScore({
    vendorReadinessPercent: 50,
    vendorCount: 2,
    vendorsWithGaps: 2,
    criticalVendorGapCount: 1,
  }) < 60,
  "vendor health penalized",
);

const composite = computeCompositeHealthScore({
  postureScore: 70,
  vendorHealthScore: 80,
  gapClosurePercent: 90,
});
assert(composite > 70 && composite < 85, "composite in range");

const frameworkRows = [
  {
    framework: "soc2",
    label: "SOC 2",
    consolePath: "/governance/compliance/type-ii",
    controlCount: 10,
    readinessPercent: 55,
    priorReadinessPercent: 50,
    readinessDelta: 5,
    covered: 5,
    partial: 2,
    none: 3,
    improved: 2,
    unchanged: 5,
    regressed: 1,
    exceptionCount: 1,
    weakestDomain: null,
    auditEventsScanned: 0,
    acceptedPolicyCount: 0,
  },
] satisfies FrameworkBaselineRow[];

const posture = buildCompliancePostureScorePackFromParts({
  orgId: "org-1",
  periodDays: 30,
  programReadinessPercent: 65,
  attestationClosurePercent: 70,
  vendorReadinessPercent: 75,
  gapClosurePercent: 50,
  overallRiskScore: 40,
  readinessTrendDelta: 3,
  attestationOverdue: 2,
  openGapRemediations: 3,
  frameworkRows,
  criticalVendorCount: 1,
  vendorCount: 2,
});

const vendorGaps = buildInheritedControlCoverageGapPackFromVendors({
  orgId: "org-1",
  periodDays: 30,
  vendors: [],
});

const pack = buildComplianceControlHealthScorecardFromParts({
  orgId: "org-1",
  periodDays: 30,
  posture,
  vendorGaps,
});

assert(pack.metrics.length === 5, "five metrics");
const expectedHealth = computeCompositeHealthScore({
  postureScore: pack.postureScore,
  vendorHealthScore: pack.vendorHealthScore,
  gapClosurePercent: pack.gapClosurePercent,
});
assert(pack.healthScore === expectedHealth, "health score matches blend");
assert(pack.leadershipActions.length > 0, "leadership actions");
assert(pack.leadershipSummary.includes("Org control health"), "summary text");

const metrics = buildHealthMetricRows({
  postureScore: 40,
  programReadinessPercent: 40,
  vendorHealthScore: 45,
  gapClosurePercent: 30,
  attestationClosurePercent: 35,
  vendorCount: 1,
  vendorsWithGaps: 1,
  totalInheritedGaps: 2,
  openGapRemediations: 2,
  attestationOverdue: 1,
});
const actions = buildScorecardLeadershipActions({
  metrics,
  postureScore: 40,
  vendorsWithGaps: 1,
  criticalVendorGapCount: 0,
  openGapRemediations: 2,
  attestationOverdue: 1,
});
assert(actions.length >= 2, "multiple actions when weak");

assert(
  isPathAllowedForAuditor("/governance/compliance/control-health-scorecard"),
  "auditor path",
);

console.log("test-compliance-control-health-scorecard: all checks passed");
