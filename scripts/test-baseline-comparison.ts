import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  BASELINE_COMPARISON_FRAMEWORKS,
  baselineComparisonToCsv,
  buildBaselineComparisonFromReports,
  buildFrameworkBaselineRow,
  buildSyntheticContinuousReportForTest,
  priorReadinessPercentFromMonitoring,
  readinessPercentFromMonitoring,
  summarizeTrendCounts,
} from "../lib/compliance/baseline-comparison";
import { buildControlMonitoringForFramework } from "../lib/compliance/continuous-assessment";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(BASELINE_COMPARISON_FRAMEWORKS.length === 8, "eight frameworks in baseline comparison");

function emptySummary(framework: (typeof BASELINE_COMPARISON_FRAMEWORKS)[number]): ComplianceSummary {
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

const soc2Current = emptySummary("soc2");
const soc2Prior = emptySummary("soc2");
soc2Current.rows[0] = {
  ...soc2Current.rows[0],
  auditEvidenceCount: 2,
  status: "covered",
};

const soc2Report = buildSyntheticContinuousReportForTest("soc2", soc2Current, soc2Prior);
const isoReport = buildSyntheticContinuousReportForTest("iso27001", emptySummary("iso27001"), emptySummary("iso27001"));

const soc2Row = buildFrameworkBaselineRow(soc2Report);
assert(soc2Row.readinessPercent > 0, "soc2 readiness from real catalog row coverage");
assert(soc2Row.controlCount === 9, "nine soc2 controls");

const pack = buildBaselineComparisonFromReports([soc2Report, isoReport], {
  orgId: "org-real-shape",
  periodDays: 30,
});
assert(pack.frameworkCount === 2, "pack includes provided reports");
assert(pack.lowestReadinessFramework === "iso27001", "iso has zero readiness");

const monitoring = buildControlMonitoringForFramework("soc2", soc2Current, soc2Prior);
const trends = summarizeTrendCounts(monitoring);
assert(trends.improved + trends.unchanged + trends.regressed === monitoring.length, "trend partition");

assert(
  readinessPercentFromMonitoring(monitoring) === priorReadinessPercentFromMonitoring(monitoring) ||
    readinessPercentFromMonitoring(monitoring) > priorReadinessPercentFromMonitoring(monitoring),
  "readiness helpers run on real monitoring rows",
);

const csv = baselineComparisonToCsv(pack);
assert(csv.includes("readiness_delta"), "csv export columns");
assert(csv.includes("SOC 2"), "csv includes framework label");

assert(
  isPathAllowedForAuditor("/governance/compliance/baseline-comparison"),
  "auditor can open baseline comparison",
);

console.log("test-baseline-comparison: all checks passed");
