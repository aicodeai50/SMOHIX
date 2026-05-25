import {
  buildCrossFrameworkControlAdjacency,
  buildCrossoverObligationEntries,
  buildObligationCrossoverReportFromEntries,
  controlsLinked,
  dueWindowsOverlap,
} from "../lib/compliance/obligation-crossover-report";
import type { RegulatoryObligationItem } from "../lib/compliance/regulatory-obligation-heatmap";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const adjacency = buildCrossFrameworkControlAdjacency();

assert(controlsLinked(["soc2:CC6.1"], ["iso:A.5.15"], adjacency), "soc2-iso crosswalk link");
assert(!controlsLinked(["soc2:CC1.2"], ["pcidss:12.3.1"], adjacency), "unrelated controls");
assert(dueWindowsOverlap("2026-05-20T00:00:00Z", "2026-05-24T00:00:00Z"), "7d window overlap");
assert(!dueWindowsOverlap("2026-05-01T00:00:00Z", "2026-05-20T00:00:00Z"), "far apart");

const items: RegulatoryObligationItem[] = [
  {
    id: "evidence-req-1",
    dimension: "assessor",
    bucketKey: "soc2",
    bucketLabel: "SOC 2",
    title: "Evidence request: access review",
    dueAt: "2026-05-22T00:00:00.000Z",
    urgency: "due_soon",
    statusLabel: "open",
    href: "/governance/compliance/evidence-requests",
    framework: "soc2",
    vendorTier: null,
    testingKind: null,
  },
  {
    id: "testing-sched-iso",
    dimension: "testing",
    bucketKey: "framework_checkpoint",
    bucketLabel: "Framework checkpoint",
    title: "ISO checkpoint window",
    dueAt: "2026-05-24T00:00:00.000Z",
    urgency: "due_soon",
    statusLabel: "due",
    href: "/governance/compliance/testing-schedules",
    framework: "iso27001",
    vendorTier: null,
    testingKind: "framework_checkpoint",
  },
];

const entries = buildCrossoverObligationEntries({
  items,
  attestations: [],
  testingControlIdsByObligationId: new Map([
    ["testing-sched-iso", ["iso:A.5.15"]],
  ]),
  evidenceControlIdByObligationId: new Map([["evidence-req-1", "soc2:CC6.1"]]),
  adjacency,
});

assert(entries[0]!.linkedFrameworks.length >= 2, "soc2 request spans linked frameworks");
assert(entries[1]!.linkedFrameworks.includes("iso27001"), "iso testing entry");

const pack = buildObligationCrossoverReportFromEntries({
  orgId: "org-1",
  horizonDays: 90,
  entries,
  adjacency,
});

assert(pack.crossoverClusterCount >= 1, "forms crossover cluster");
assert(pack.frameworkPairs.length >= 1, "framework pair rollup");
assert(pack.multiFrameworkObligationCount >= 1, "multi-framework count");

const csv = pack.clusters.length > 0;
assert(csv, "has clusters for export path");

assert(
  isPathAllowedForAuditor("/governance/compliance/obligation-crossover"),
  "auditor path allowed",
);

console.log("test-obligation-crossover-report: ok");
