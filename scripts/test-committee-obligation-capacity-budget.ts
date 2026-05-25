import {
  buildCapacityWeekRows,
  buildCommitteeObligationCapacityBudgetFromParts,
  countCapacityOwners,
  resolveCapacityOwnerCount,
  COMMITTEE_OBLIGATION_CAPACITY_BUDGET_VERSION,
} from "../lib/compliance/committee-obligation-capacity-budget";
import {
  BOARD_OBLIGATION_FORECAST_VERSION,
  type BoardObligationForecastPack,
} from "../lib/compliance/board-obligation-forecast";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const settings = { hoursPerObligation: 2, ownerHoursPerWeek: 8 };

const forecast: BoardObligationForecastPack = {
  version: BOARD_OBLIGATION_FORECAST_VERSION,
  generatedAt: "2026-05-20T00:00:00.000Z",
  orgId: "org-1",
  horizonDays: 90,
  forecastWeekCount: 2,
  weekKeys: ["2026-05-19", "2026-06-02"],
  buckets: [
    {
      weekKey: "2026-05-19",
      weekLabel: "current",
      isCurrentWeek: true,
      totalCount: 3,
      overdueCount: 1,
      dueSoonCount: 1,
      upcomingCount: 1,
      densityScore: 50,
      byFramework: [],
    },
    {
      weekKey: "2026-06-02",
      weekLabel: "peak",
      isCurrentWeek: false,
      totalCount: 10,
      overdueCount: 0,
      dueSoonCount: 2,
      upcomingCount: 8,
      densityScore: 100,
      byFramework: [],
    },
  ],
  peakWeekKey: "2026-06-02",
  peakWeekCount: 10,
  totalForecastObligations: 13,
  currentOverdue: 1,
  currentDueSoon: 1,
  committeeSummary: "Peak load.",
  milestones: [],
};

const weeks = buildCapacityWeekRows({
  forecast,
  settings,
  capacityOwnerCount: 2,
});

assert(weeks[0]!.estimatedOwnerHours === 6, "3 * 2h");
assert(weeks[0]!.availableOwnerHours === 16, "2 owners * 8h");
assert(!weeks[0]!.isShortfall, "current week ok");

assert(weeks[1]!.estimatedOwnerHours === 20, "10 * 2h");
assert(weeks[1]!.isShortfall, "peak week shortfall");
assert(weeks[1]!.shortfallHours === 4, "20 - 16");

const pack = buildCommitteeObligationCapacityBudgetFromParts({
  orgId: "org-1",
  horizonDays: 90,
  settings,
  capacityOwnerCount: 2,
  accountableOwnerCount: 3,
  forecast,
});

assert(pack.version === COMMITTEE_OBLIGATION_CAPACITY_BUDGET_VERSION, "version");
assert(pack.shortfallWeekCount === 1, "one shortfall week");
assert(pack.peakShortfallHours === 4, "peak shortfall");

assert(countCapacityOwners([{ role: "owner" }, { role: "viewer" }]) === 1, "min 1 owner");
assert(
  resolveCapacityOwnerCount({ memberCount: 2, accountableCount: 5 }) === 5,
  "max of counts",
);

assert(
  isPathAllowedForAuditor("/governance/compliance/committee-capacity-budget"),
  "auditor path",
);

console.log("test-committee-obligation-capacity-budget: ok");
