import {
  buildBoardObligationForecastFromItems,
  buildForecastWeekKeys,
  densityScoreForCount,
  startOfUtcWeek,
} from "../lib/compliance/board-obligation-forecast";
import type { RegulatoryObligationItem } from "../lib/compliance/regulatory-obligation-heatmap";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date("2026-05-20T12:00:00.000Z");
const weekKeys = buildForecastWeekKeys(90, now);
assert(weekKeys.length >= 4, "forecast week keys");

const currentWeek = weekKeys[0]!;
const items: RegulatoryObligationItem[] = [
  {
    id: "a1",
    dimension: "assessor",
    bucketKey: "soc2",
    bucketLabel: "SOC 2",
    title: "Overdue request",
    dueAt: "2026-05-10T00:00:00.000Z",
    urgency: "overdue",
    statusLabel: "overdue",
    href: "/governance/compliance/evidence-requests",
    framework: "soc2",
    vendorTier: null,
    testingKind: null,
  },
  {
    id: "a2",
    dimension: "testing",
    bucketKey: "checkpoint",
    bucketLabel: "Checkpoint",
    title: "ISO checkpoint",
    dueAt: "2026-06-03T00:00:00.000Z",
    urgency: "upcoming",
    statusLabel: "upcoming",
    href: "/governance/compliance/testing-schedules",
    framework: "iso27001",
    vendorTier: null,
    testingKind: "framework_checkpoint",
  },
];

const pack = buildBoardObligationForecastFromItems({
  orgId: "org-1",
  horizonDays: 90,
  items,
  now,
});

assert(pack.currentOverdue === 1, "counts overdue");
assert(pack.buckets.some((b) => b.weekKey === currentWeek && b.overdueCount >= 1), "overdue in current week");
assert(
  pack.buckets.some((b) => b.weekKey === startOfUtcWeek("2026-06-03T00:00:00.000Z") && b.totalCount >= 1),
  "future week bucket",
);
assert(pack.peakWeekCount >= 1, "peak week");
assert(pack.committeeSummary.includes("open obligations"), "committee summary");
assert(densityScoreForCount(5, 10) === 50, "density scale");

assert(
  isPathAllowedForAuditor("/governance/compliance/obligation-forecast"),
  "auditor path",
);

console.log("test-board-obligation-forecast: ok");
