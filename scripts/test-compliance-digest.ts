import {
  COMPLIANCE_DIGEST_VERSION,
  computeComplianceDigestDeltas,
  snapshotFromProgramDashboard,
  type ComplianceDigestSnapshot,
} from "../lib/compliance/compliance-digest";
import type { ComplianceProgramDashboard } from "../lib/compliance/program-dashboard";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const mockDashboard: ComplianceProgramDashboard = {
  generatedAt: "2026-05-25T12:00:00.000Z",
  periodDays: 30,
  overallReadinessPercent: 72.5,
  soc2: {
    readinessPercent: 80,
    exceptionCount: 1,
    trends: { improved: 3, unchanged: 4, regressed: 1 },
  },
  iso27001: {
    readinessPercent: 70,
    exceptionCount: 2,
    domainCount: 4,
    weakestDomain: "Organizational",
  },
  pcidss: {
    readinessPercent: 65,
    exceptionCount: 1,
    requirementCount: 6,
    weakestRequirement: "Req 10",
  },
  hipaa: {
    readinessPercent: 60,
    exceptionCount: 0,
    safeguardCount: 5,
    weakestSafeguard: null,
  },
  nistCsf: {
    readinessPercent: 68,
    exceptionCount: 1,
    overallMaturityTier: 2,
    overallMaturityLabel: "Repeatable",
    functionCount: 6,
    weakestFunction: "Detect",
  },
  cisV8: {
    readinessPercent: 55,
    exceptionCount: 2,
    attainedIg: "IG1",
    attainedIgLabel: "Implementation Group 1",
    implementationGroupCount: 3,
    weakestIg: "IG2",
  },
  cmmcL2: {
    readinessPercent: 50,
    exceptionCount: 3,
    sprsScore: 88,
    sprsBand: "Moderate",
    familyCount: 14,
    weakestFamily: "AC",
  },
  gdprArt32: {
    readinessPercent: 74,
    exceptionCount: 0,
    dpaBand: "Adequate",
    domainCount: 4,
    weakestDomain: null,
  },
  attestations: { total: 10, attested: 6, pending: 2, overdue: 2 },
  vendors: { count: 4, critical: 1, avgReadinessPercent: 71, reusedEvidenceCount: 12 },
  evidenceBundleCount: 2,
  legalHoldIncidentCount: 0,
  topGaps: [
    {
      framework: "soc2",
      controlRef: "CC6.1",
      title: "Logical access",
      reason: "No recent audit evidence",
    },
  ],
  gapRemediations: { open: 1, inProgress: 0, resolved: 2, dismissed: 0, tracked: 3 },
  overdueAttestations: [
    {
      controlRef: "soc2:CC5.3",
      title: "Control activities",
      dueAt: "2026-05-01T00:00:00.000Z",
      ownerLabel: "Security lead",
    },
    {
      controlRef: "iso:A.5.15",
      title: "Access control",
      dueAt: "2026-05-10T00:00:00.000Z",
      ownerLabel: null,
    },
  ],
};

const current = snapshotFromProgramDashboard(mockDashboard);
assert(current.frameworks.length === 8, "eight framework snapshots");
assert(current.overdueControlRefs.length === 2, "two overdue refs");

const baseline = computeComplianceDigestDeltas(null, current, mockDashboard.overdueAttestations);
assert(baseline.baseline === true, "first run is baseline");
assert(baseline.overallReadinessDelta === null, "no overall delta on baseline");
assert(baseline.newOverdueAttestations.length === 2, "baseline lists all overdue");

const previous: ComplianceDigestSnapshot = {
  ...current,
  overallReadinessPercent: 68,
  frameworks: current.frameworks.map((f) =>
    f.key === "soc2" ? { ...f, readinessPercent: 75 } : f,
  ),
  attestations: { total: 10, attested: 5, pending: 3, overdue: 1 },
  overdueControlRefs: ["soc2:CC5.3"],
  soc2Trends: { improved: 2, unchanged: 5, regressed: 1 },
};

const deltas = computeComplianceDigestDeltas(previous, current, mockDashboard.overdueAttestations);
assert(!deltas.baseline, "second run has deltas");
assert(deltas.overallReadinessDelta === 4.5, "overall readiness delta computed");
const soc2Delta = deltas.frameworks.find((f) => f.key === "soc2");
assert(soc2Delta?.deltaPercent === 5, "soc2 readiness increased by 5 points");
assert(deltas.soc2TrendsDelta.improved === 1, "one more improved trend");
assert(deltas.overdueDelta === 1, "one additional overdue attestation");
assert(deltas.newOverdueAttestations.length === 1, "one newly overdue control");
assert(deltas.newOverdueAttestations[0]?.controlRef === "iso:A.5.15", "iso control is new overdue");

assert(COMPLIANCE_DIGEST_VERSION === "smohix-compliance-digest/1", "digest version constant");
assert(isPathAllowedForAuditor("/governance/compliance/digest"), "auditor can open digest page");

console.log("test-compliance-digest: all checks passed");
