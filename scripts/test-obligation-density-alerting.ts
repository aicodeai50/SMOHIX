import {
  evaluateObligationDensityBreaches,
  buildObligationDensityAlertingFromParts,
  OBLIGATION_DENSITY_ALERTING_VERSION,
} from "../lib/compliance/obligation-density-alerting";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const settings = {
  enabled: true,
  weeklyThreshold: 5,
  peakThreshold: 10,
  overdueThreshold: 2,
  emailEnabled: true,
};

const forecast = {
  version: "zentro-board-obligation-forecast/1" as const,
  generatedAt: "2026-05-20T00:00:00.000Z",
  orgId: "org-1",
  horizonDays: 90,
  forecastWeekCount: 13,
  weekKeys: ["2026-05-19"],
  buckets: [
    {
      weekKey: "2026-05-19",
      weekLabel: "week",
      isCurrentWeek: true,
      totalCount: 6,
      overdueCount: 1,
      dueSoonCount: 2,
      upcomingCount: 3,
      densityScore: 60,
      byFramework: [],
    },
  ],
  peakWeekKey: "2026-06-02",
  peakWeekCount: 11,
  totalForecastObligations: 20,
  currentOverdue: 3,
  currentDueSoon: 4,
  committeeSummary: "Peak week load.",
  milestones: [],
};

const breaches = evaluateObligationDensityBreaches({ forecast, settings });
assert(breaches.length === 3, "all three breach types");
assert(breaches.some((b) => b.alertType === "weekly_density"), "weekly");
assert(breaches.some((b) => b.alertType === "peak_week"), "peak");
assert(breaches.some((b) => b.alertType === "overdue_spike"), "overdue");

const pack = buildObligationDensityAlertingFromParts({
  orgId: "org-1",
  horizonDays: 90,
  settings,
  forecast,
});

assert(pack.anyBreach, "pack has breach");
assert(pack.currentWeekCount === 6, "current week count");
assert(pack.version === OBLIGATION_DENSITY_ALERTING_VERSION, "version");

const noBreach = evaluateObligationDensityBreaches({
  forecast: { ...forecast, buckets: [{ ...forecast.buckets[0]!, totalCount: 2 }], peakWeekCount: 5, currentOverdue: 0 },
  settings,
});
assert(noBreach.length === 0, "below thresholds");

assert(
  isPathAllowedForAuditor("/governance/compliance/obligation-density-alerts"),
  "auditor path",
);

console.log("test-obligation-density-alerting: ok");
