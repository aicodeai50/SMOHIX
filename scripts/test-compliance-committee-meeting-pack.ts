import JSZip from "jszip";

import { buildCompliancePostureScorePackFromParts } from "../lib/compliance/compliance-posture-score";
import { buildComplianceControlHealthScorecardFromParts } from "../lib/compliance/compliance-control-health-scorecard";
import { buildInheritedControlCoverageGapPackFromVendors } from "../lib/compliance/inherited-control-coverage-gaps";
import { buildComplianceExceptionRegisterPackFromParts } from "../lib/compliance/compliance-exception-register";
import type { FrameworkBaselineRow } from "../lib/compliance/baseline-comparison";
import type { ComplianceProgramDashboard } from "../lib/compliance/program-dashboard";
import {
  buildCommitteeMeetingOpenGapsPack,
  buildCommitteeMeetingPackFilesFromParts,
  buildCommitteeMeetingPackManifest,
  buildCommitteeMeetingPackSummaryHtml,
  buildCommitteeMeetingPackSummaryText,
  committeeMeetingOpenGapsToCsv,
  committeeMeetingPackToZip,
  COMPLIANCE_COMMITTEE_MEETING_PACK_VERSION,
  finalizeCommitteeMeetingPackManifest,
} from "../lib/compliance/compliance-committee-meeting-pack";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const frameworkRows = [
  {
    framework: "soc2",
    label: "SOC 2",
    consolePath: "/governance/compliance/type-ii",
    controlCount: 10,
    readinessPercent: 60,
    priorReadinessPercent: 55,
    readinessDelta: 5,
    covered: 6,
    partial: 2,
    none: 2,
    improved: 2,
    unchanged: 6,
    regressed: 0,
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
  gapClosurePercent: 55,
  overallRiskScore: 40,
  readinessTrendDelta: 3,
  attestationOverdue: 1,
  openGapRemediations: 2,
  frameworkRows,
  criticalVendorCount: 0,
  vendorCount: 1,
});

const vendorGaps = buildInheritedControlCoverageGapPackFromVendors({
  orgId: "org-1",
  periodDays: 30,
  vendors: [],
});

const scorecard = buildComplianceControlHealthScorecardFromParts({
  orgId: "org-1",
  periodDays: 30,
  posture,
  vendorGaps,
});

const exceptions = buildComplianceExceptionRegisterPackFromParts({
  orgId: "org-1",
  periodDays: 30,
  rows: [],
});

const program = {
  generatedAt: new Date().toISOString(),
  periodDays: 30,
  overallReadinessPercent: 65,
  topGaps: [
    {
      framework: "soc2",
      controlRef: "CC6.1",
      title: "Logical access",
      reason: "Missing evidence",
    },
  ],
  gapRemediations: { open: 1, inProgress: 1, resolved: 0, dismissed: 0, tracked: 2 },
} as ComplianceProgramDashboard;

const openGaps = buildCommitteeMeetingOpenGapsPack({
  program,
  remediationRows: [
    {
      id: "r1",
      gapKey: "soc2:CC6.1:abc",
      framework: "soc2",
      controlRef: "CC6.1",
      title: "Logical access",
      reason: "Missing evidence",
      runbookSlug: "grc-evidence-sprint",
      playbookId: null,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    },
  ],
});

const csv = committeeMeetingOpenGapsToCsv(openGaps);
assert(csv.includes("assessment_gap"), "open gaps csv has assessment rows");
assert(csv.includes("remediation"), "open gaps csv has remediation rows");

const html = buildCommitteeMeetingPackSummaryHtml({
  orgName: "Acme",
  periodDays: 30,
  generatedAt: new Date().toISOString(),
  scorecard,
  posture,
  exceptions,
  openGaps,
});
assert(html.includes("Compliance committee meeting pack"), "html title");
assert(html.includes("CC6.1"), "html lists gaps");

const text = buildCommitteeMeetingPackSummaryText({
  orgName: "Acme",
  periodDays: 30,
  generatedAt: new Date().toISOString(),
  scorecard,
  posture,
  exceptions,
  openGaps,
});
assert(text.includes("Health score"), "text summary");

const files = buildCommitteeMeetingPackFilesFromParts({
  orgId: "org-1",
  orgName: "Acme",
  periodDays: 30,
  scorecard,
  posture,
  exceptions,
  openGaps,
});

assert(files.length === 10, "ten pack files");

const partial = buildCommitteeMeetingPackManifest(files);
const manifest = finalizeCommitteeMeetingPackManifest({
  ...partial,
  periodDays: 30,
  orgId: "org-1",
  orgName: "Acme",
});

assert(manifest.version === COMPLIANCE_COMMITTEE_MEETING_PACK_VERSION, "version set");
assert(manifest.fileCount === 10, "manifest file count");

async function main() {
  const zipBytes = await committeeMeetingPackToZip(files, manifest);
  assert(zipBytes.length > 200, "zip non-empty");
  const zip = await JSZip.loadAsync(zipBytes);
  assert(zip.file("committee-pack-summary.html") != null, "html in zip");
  assert(zip.file("scorecard/control-health-scorecard.json") != null, "scorecard in zip");
  assert(zip.file("manifest.json") != null, "manifest in zip");

  assert(
    isPathAllowedForAuditor("/governance/compliance/committee-meeting-pack"),
    "auditor path",
  );

  console.log("test-compliance-committee-meeting-pack: all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
