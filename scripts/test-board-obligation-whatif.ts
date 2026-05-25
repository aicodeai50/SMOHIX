import {
  applyObligationWhatIfScenario,
  buildBoardObligationWhatIfFromParts,
  OBLIGATION_WHATIF_SCENARIOS,
  simulateObligationWhatIfScenario,
  BOARD_OBLIGATION_WHATIF_VERSION,
} from "../lib/compliance/board-obligation-whatif";
import { buildBoardObligationForecastFromItems } from "../lib/compliance/board-obligation-forecast";
import type { RegulatoryObligationItem } from "../lib/compliance/regulatory-obligation-heatmap";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date("2026-05-20T12:00:00.000Z");
const settings = {
  enabled: true,
  weeklyThreshold: 5,
  peakThreshold: 8,
  overdueThreshold: 2,
  emailEnabled: true,
};

const items: RegulatoryObligationItem[] = [
  {
    id: "w1",
    dimension: "assessor",
    bucketKey: "soc2",
    bucketLabel: "SOC 2",
    title: "SOC evidence",
    dueAt: "2026-05-21T00:00:00.000Z",
    urgency: "due_soon",
    statusLabel: "due_soon",
    href: "/governance/compliance/evidence-requests",
    framework: "soc2",
    vendorTier: null,
    testingKind: null,
  },
  {
    id: "w2",
    dimension: "testing",
    bucketKey: "checkpoint",
    bucketLabel: "PCI checkpoint",
    title: "PCI test",
    dueAt: "2026-06-10T00:00:00.000Z",
    urgency: "upcoming",
    statusLabel: "upcoming",
    href: "/governance/compliance/testing-schedules",
    framework: "pcidss",
    vendorTier: null,
    testingKind: "framework_checkpoint",
  },
];

const baseline = buildBoardObligationForecastFromItems({
  orgId: "org-1",
  horizonDays: 90,
  items,
  now,
});

const defer2 = OBLIGATION_WHATIF_SCENARIOS.find((s) => s.id === "defer-2w")!;
const shifted = applyObligationWhatIfScenario(items, defer2, now);
assert(shifted[0]!.dueAt > items[0]!.dueAt, "due dates shift forward");

const descope = OBLIGATION_WHATIF_SCENARIOS.find((s) => s.id === "descope-pci-hipaa")!;
const slimmed = applyObligationWhatIfScenario(items, descope, now);
assert(slimmed.length === 1, "pci item removed");

const result = simulateObligationWhatIfScenario({
  scenario: descope,
  items,
  orgId: "org-1",
  horizonDays: 90,
  settings,
  baseline,
  baselineBreachCount: 0,
  now,
});
assert(result.totalObligationsDelta < 0, "fewer obligations when descoped");

const pack = buildBoardObligationWhatIfFromParts({
  orgId: "org-1",
  horizonDays: 90,
  items,
  settings,
  now,
});

assert(pack.version === BOARD_OBLIGATION_WHATIF_VERSION, "version");
assert(pack.results.length === OBLIGATION_WHATIF_SCENARIOS.length, "all scenarios");
assert(pack.bestReliefScenarioId !== null, "best relief id");

assert(
  isPathAllowedForAuditor("/governance/compliance/obligation-whatif"),
  "auditor path",
);

console.log("test-board-obligation-whatif: ok");
