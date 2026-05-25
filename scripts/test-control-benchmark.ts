import { buildFrameworkBaselineRow, buildSyntheticContinuousReportForTest } from "../lib/compliance/baseline-comparison";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildControlBenchmarkPackFromBaselines,
  buildControlBenchmarkRow,
  INDUSTRY_CONTROL_BENCHMARKS,
  percentileToBand,
  readinessToPercentile,
} from "../lib/compliance/control-benchmark";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(INDUSTRY_CONTROL_BENCHMARKS.length === 8, "eight industry benchmarks");

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
current.rows[0] = { ...current.rows[0], auditEvidenceCount: 3, status: "covered" };
const report = buildSyntheticContinuousReportForTest("soc2", current, emptySummary("soc2"));
const baseline = buildFrameworkBaselineRow(report);
const row = buildControlBenchmarkRow(baseline);

assert(row.benchmarkAvailable, "soc2 benchmark available");
assert(row.percentile !== null && row.percentile > 0, "percentile computed");
assert(row.deltaVsMedian !== null, "delta vs median");

const bench = INDUSTRY_CONTROL_BENCHMARKS[0];
const lowPct = readinessToPercentile(bench.p25 - 5, bench);
const highPct = readinessToPercentile(bench.p90 + 5, bench);
assert(lowPct < highPct, "percentile increases with readiness");
assert(percentileToBand(10) === "bottom_quartile", "bottom quartile band");
assert(percentileToBand(80) === "top_quartile", "top quartile band");

const pack = buildControlBenchmarkPackFromBaselines({
  orgId: "org-1",
  periodDays: 30,
  baselines: [baseline],
});
assert(pack.benchmarksAvailable, "pack has benchmarks");
assert(pack.orgOverallReadiness > 0, "overall readiness");

assert(
  isPathAllowedForAuditor("/governance/compliance/benchmarking"),
  "auditor can open benchmarking",
);

console.log("test-control-benchmark: all checks passed");
