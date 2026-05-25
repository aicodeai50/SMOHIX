import { startOfUtcWeek } from "../lib/compliance/board-obligation-forecast";
import {
  buildObligationDensityTrendHistoryFromParts,
  buildTrailingQuarterWeekKeys,
  bucketAlertDeliveriesByWeek,
  bucketObligationCountsByWeek,
  OBLIGATION_DENSITY_TREND_HISTORY_VERSION,
} from "../lib/compliance/obligation-density-trend-history";
import type { RegulatoryObligationItem } from "../lib/compliance/regulatory-obligation-heatmap";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date("2026-05-20T12:00:00.000Z");
const weekKeys = buildTrailingQuarterWeekKeys(90, now);
assert(weekKeys.length === 13, "13 trailing weeks");

const items: RegulatoryObligationItem[] = [
  {
    id: "h1",
    dimension: "assessor",
    bucketKey: "soc2",
    bucketLabel: "SOC 2",
    title: "Past due",
    dueAt: "2026-04-14T00:00:00.000Z",
    urgency: "overdue",
    statusLabel: "overdue",
    href: "/governance/compliance/evidence-requests",
    framework: "soc2",
    vendorTier: null,
    testingKind: null,
  },
  {
    id: "h2",
    dimension: "testing",
    bucketKey: "checkpoint",
    bucketLabel: "Checkpoint",
    title: "Current week",
    dueAt: "2026-05-21T00:00:00.000Z",
    urgency: "due_soon",
    statusLabel: "due_soon",
    href: "/governance/compliance/testing-schedules",
    framework: "iso27001",
    vendorTier: null,
    testingKind: "framework_checkpoint",
  },
];

const aprilWeek = startOfUtcWeek("2026-04-14T00:00:00.000Z");
const currentWeek = startOfUtcWeek("2026-05-21T00:00:00.000Z");
const obBuckets = bucketObligationCountsByWeek(items, weekKeys);
assert((obBuckets.get(aprilWeek)?.total ?? 0) >= 1, "April week count");
assert((obBuckets.get(currentWeek)?.total ?? 0) >= 1, "current week count");

const alertRows = [
  {
    id: "1",
    orgId: "org-1",
    alertKey: "weekly_density:2026-05-19",
    alertType: "weekly_density" as const,
    channel: "slack" as const,
    recipient: null,
    metricValue: 9,
    thresholdValue: 8,
    createdAt: "2026-05-20T10:00:00.000Z",
  },
];

const alertBuckets = bucketAlertDeliveriesByWeek(alertRows, weekKeys);
assert((alertBuckets.get(currentWeek)?.count ?? 0) === 1, "alert in current week");

const settings = {
  enabled: true,
  weeklyThreshold: 5,
  peakThreshold: 10,
  overdueThreshold: 3,
  emailEnabled: true,
};

const pack = buildObligationDensityTrendHistoryFromParts({
  orgId: "org-1",
  trailingDays: 90,
  weekKeys,
  items,
  alertRows,
  settings,
  forecast: null,
  now,
});

assert(pack.version === OBLIGATION_DENSITY_TREND_HISTORY_VERSION, "version");
assert(pack.points.some((p) => !p.isFuture && p.alertDeliveryCount > 0), "alert point");
assert(pack.totalAlertDeliveries === 1, "total alerts");
assert(pack.peakTrailingCount >= 1, "peak");

assert(
  isPathAllowedForAuditor("/governance/compliance/obligation-density-trend-history"),
  "auditor path",
);

console.log("test-obligation-density-trend-history: ok");
