import { buildFrameworkBaselineRow, buildSyntheticContinuousReportForTest } from "../lib/compliance/baseline-comparison";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildComplianceRiskHeatmapFromInputs,
  buildFrameworkRiskCells,
  buildVendorTierRollup,
  computeOverallRiskScore,
  frameworkRiskScore,
  riskHeatmapToCsv,
  riskScoreToLevel,
  vendorRiskScore,
} from "../lib/compliance/compliance-risk-heatmap";
import type { ComplianceSummary } from "../lib/compliance/types";
import type { ThirdPartyVendorRow } from "../lib/third-party-risk/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function emptySummary(framework: "soc2" | "iso27001"): ComplianceSummary {
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

const soc2Report = buildSyntheticContinuousReportForTest(
  "soc2",
  emptySummary("soc2"),
  emptySummary("soc2"),
);
const isoReport = buildSyntheticContinuousReportForTest(
  "iso27001",
  emptySummary("iso27001"),
  emptySummary("iso27001"),
);
const rows = [buildFrameworkBaselineRow(soc2Report), buildFrameworkBaselineRow(isoReport)];

const cells = buildFrameworkRiskCells(rows);
assert(cells.length === 2, "two framework cells");
assert(cells.every((c) => c.riskScore >= 0 && c.riskScore <= 100), "framework risk bounded");

const lowReadinessRow = { ...rows[1], readinessPercent: 10, exceptionCount: 5, regressed: 2, readinessDelta: -8 };
const highRisk = frameworkRiskScore(lowReadinessRow);
assert(highRisk > frameworkRiskScore(rows[0]), "lower readiness increases risk");

assert(riskScoreToLevel(80) === "critical", "critical threshold");
assert(riskScoreToLevel(10) === "low", "low threshold");

const mockVendor: ThirdPartyVendorRow = {
  id: "v-1",
  orgId: "org-1",
  name: "Critical SaaS",
  category: "saas",
  riskTier: "critical",
  status: "active",
  reviewDueAt: null,
  contactEmail: null,
  notes: null,
  createdAt: new Date().toISOString(),
  controls: [],
  controlCount: 4,
  attestedControlCount: 0,
  reusedEvidenceCount: 0,
  readinessPercent: 20,
};

assert(vendorRiskScore(mockVendor) > vendorRiskScore({ ...mockVendor, riskTier: "low", readinessPercent: 80 }), "tier and readiness affect vendor risk");

const vendors = [mockVendor];
const pack = buildComplianceRiskHeatmapFromInputs({
  orgId: "org-test",
  periodDays: 30,
  programReadinessPercent: 55,
  attestationOverdue: 2,
  openGapRemediations: 1,
  frameworkRows: rows,
  vendors,
});

assert(pack.frameworkCells.length === 2, "pack frameworks");
assert(pack.hotspots.length > 0, "hotspots populated");
assert(pack.overallLevel === riskScoreToLevel(pack.overallRiskScore), "overall level matches score");
assert(computeOverallRiskScore(pack.frameworkCells, vendors) === pack.overallRiskScore, "overall score consistent");

const rollup = buildVendorTierRollup(vendors);
assert(rollup.find((r) => r.tier === "critical")?.vendorCount === 1, "critical tier count");

const csv = riskHeatmapToCsv(pack);
assert(csv.includes("framework,soc2"), "csv has framework rows");
assert(csv.includes("hotspot"), "csv has hotspots");

assert(
  isPathAllowedForAuditor("/governance/compliance/risk-heatmap"),
  "auditor can open risk heatmap",
);

console.log("test-compliance-risk-heatmap: all checks passed");
