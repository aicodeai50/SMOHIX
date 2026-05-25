import { buildFrameworkRiskCells } from "../lib/compliance/compliance-risk-heatmap";
import { buildFrameworkBaselineRow, buildSyntheticContinuousReportForTest } from "../lib/compliance/baseline-comparison";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildGrcExecutiveSummaryFromInputs,
  grcExecutiveSummaryToCsv,
  grcExecutiveSummaryToHtml,
  grcExecutiveSummaryToMarkdown,
} from "../lib/compliance/grc-executive-summary";
import { buildComplianceRiskHeatmapFromInputs } from "../lib/compliance/compliance-risk-heatmap";
import type { ComplianceProgramDashboard } from "../lib/compliance/program-dashboard";
import type { ComplianceSummary } from "../lib/compliance/types";
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

const soc2Report = buildSyntheticContinuousReportForTest("soc2", emptySummary("soc2"), emptySummary("soc2"));
const rows = [buildFrameworkBaselineRow(soc2Report)];

const heatmap = buildComplianceRiskHeatmapFromInputs({
  orgId: "org-1",
  periodDays: 30,
  programReadinessPercent: 62,
  attestationOverdue: 2,
  openGapRemediations: 1,
  frameworkRows: rows,
  vendors: [],
});

const program: ComplianceProgramDashboard = {
  generatedAt: new Date().toISOString(),
  periodDays: 30,
  overallReadinessPercent: 62,
  soc2: { readinessPercent: 50, exceptionCount: 2, trends: { improved: 1, unchanged: 6, regressed: 2 } },
  iso27001: { readinessPercent: 40, exceptionCount: 3, domainCount: 4, weakestDomain: "Organizational" },
  pcidss: { readinessPercent: 55, exceptionCount: 1, requirementCount: 4, weakestRequirement: "Req 10" },
  hipaa: { readinessPercent: 60, exceptionCount: 0, safeguardCount: 3, weakestSafeguard: null },
  nistCsf: {
    readinessPercent: 58,
    exceptionCount: 1,
    overallMaturityTier: 2,
    overallMaturityLabel: "Repeatable",
    functionCount: 4,
    weakestFunction: "Detect",
  },
  cisV8: {
    readinessPercent: 45,
    exceptionCount: 2,
    attainedIg: "IG1",
    attainedIgLabel: "IG1",
    implementationGroupCount: 3,
    weakestIg: "IG2",
  },
  cmmcL2: {
    readinessPercent: 48,
    exceptionCount: 2,
    sprsScore: 72,
    sprsBand: "Moderate",
    familyCount: 4,
    weakestFamily: "AC",
  },
  gdprArt32: {
    readinessPercent: 70,
    exceptionCount: 0,
    dpaBand: "Adequate",
    domainCount: 3,
    weakestDomain: null,
  },
  attestations: { total: 10, attested: 6, pending: 2, overdue: 2 },
  vendors: { count: 3, critical: 1, avgReadinessPercent: 65, reusedEvidenceCount: 4 },
  evidenceBundleCount: 1,
  legalHoldIncidentCount: 0,
  topGaps: [
    {
      framework: "soc2",
      controlRef: "CC6.1",
      title: "Logical access",
      reason: "Insufficient MFA evidence",
    },
  ],
  overdueAttestations: [],
  gapRemediations: { open: 1, inProgress: 0, resolved: 0, dismissed: 0, tracked: 1 },
};

const pack = buildGrcExecutiveSummaryFromInputs({
  orgId: "org-1",
  orgName: "Acme Corp",
  periodDays: 30,
  program,
  heatmap,
  vendorCount: 3,
});

assert(pack.orgName === "Acme Corp", "org name preserved");
assert(pack.frameworks.length === heatmap.frameworkCells.length, "framework snapshots");
assert(pack.leadershipActions.length > 0, "leadership actions derived");
assert(pack.leadershipActions.some((a) => /attestation/i.test(a)), "mentions overdue attestations");

const md = grcExecutiveSummaryToMarkdown(pack);
assert(md.includes("## Board actions"), "markdown sections");
assert(md.includes("Acme Corp"), "markdown org");

const html = grcExecutiveSummaryToHtml(pack);
assert(html.includes("<!DOCTYPE html>"), "html document");
assert(html.includes("Program readiness"), "html kpis");

const csv = grcExecutiveSummaryToCsv(pack);
assert(csv.includes("program_readiness"), "csv summary row");

assert(buildFrameworkRiskCells(rows).length === 1, "sanity");

assert(
  isPathAllowedForAuditor("/governance/compliance/executive-summary"),
  "auditor can open executive summary",
);

console.log("test-grc-executive-summary: all checks passed");
