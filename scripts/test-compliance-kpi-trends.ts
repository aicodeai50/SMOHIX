import {
  buildComplianceKpiTrendsPackFromParts,
  buildWeekKeys,
  buildWeeklyActivityFromAudit,
  computeGapVelocityPerWeek,
  interpolateReadinessPoints,
  mergeWeeklyActivityWithRemediations,
} from "../lib/compliance/compliance-kpi-trends";
import {
  buildFrameworkBaselineRow,
  buildSyntheticContinuousReportForTest,
} from "../lib/compliance/baseline-comparison";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const weekKeys = buildWeekKeys(90);
assert(weekKeys.length >= 4, "week keys generated");

const points = interpolateReadinessPoints(40, 70, weekKeys);
assert(points[0].readinessPercent === 40, "first point prior");
assert(points[points.length - 1].readinessPercent === 70, "last point current");
assert(points[1].interpolated === true, "middle interpolated");

const audit = buildWeeklyActivityFromAudit(
  [
    { event_type: "governance.compliance_gap_remediation_started", created_at: weekKeys[1] + "T12:00:00.000Z" },
    { event_type: "governance.compliance_gap_remediation_resolved", created_at: weekKeys[1] + "T14:00:00.000Z" },
    { event_type: "governance.control_attestation_signed", created_at: weekKeys[2] + "T10:00:00.000Z" },
  ],
  weekKeys,
);
assert(audit[1].gapsStarted >= 1, "gap started bucketed");
assert(audit[1].gapsResolved >= 1, "gap resolved bucketed");

const merged = mergeWeeklyActivityWithRemediations(
  audit,
  [{ createdAt: weekKeys[0] + "T00:00:00.000Z", resolvedAt: weekKeys[1] + "T00:00:00.000Z" }],
  [{ event_type: "attested", created_at: weekKeys[2] + "T00:00:00.000Z" }],
);
assert(merged.some((w) => w.attestationsSigned > 0), "attestation events merged");

function emptySummary(framework: "soc2"): ComplianceSummary {
  const controls = COMPLIANCE_CONTROLS.filter((c) => c.framework === framework);
  return {
    sinceIso: new Date().toISOString(),
    auditEventsScanned: 0,
    acceptedPolicyCount: 0,
    coveragePercent: 0,
    rows: controls.map((control) => ({
      control,
      auditEvidenceCount: 0,
      policyEvidenceCount: 0,
      status: "none" as const,
    })),
  };
}

const current = emptySummary("soc2");
current.rows[0] = { ...current.rows[0], status: "covered", auditEvidenceCount: 2 };
const report = buildSyntheticContinuousReportForTest("soc2", current, emptySummary("soc2"));
const baselineRow = buildFrameworkBaselineRow(report);

const pack = buildComplianceKpiTrendsPackFromParts({
  orgId: "org-1",
  periodDays: 90,
  weekKeys,
  baselineRows: [baselineRow],
  weeklyActivity: merged,
  attestationClosurePercent: 50,
  attestationOverdue: 1,
});

assert(pack.frameworkTrends.length === 1, "one framework trend");
assert(pack.gapVelocityPerWeek === computeGapVelocityPerWeek(merged), "velocity consistent");
assert(pack.overallReadinessPercent > 0, "overall readiness");

assert(isPathAllowedForAuditor("/governance/compliance/kpi-trends"), "auditor path");

console.log("test-compliance-kpi-trends: all checks passed");
