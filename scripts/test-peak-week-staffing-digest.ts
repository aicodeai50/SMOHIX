import {
  evaluatePeakWeekStaffingCoincidence,
  PEAK_WEEK_STAFFING_DIGEST_VERSION,
} from "../lib/compliance/committee-peak-week-staffing-digest";
import {
  COMMITTEE_OBLIGATION_CAPACITY_BUDGET_VERSION,
  type CommitteeObligationCapacityBudgetPack,
} from "../lib/compliance/committee-obligation-capacity-budget";
import { BOARD_OBLIGATION_FORECAST_VERSION } from "../lib/compliance/board-obligation-forecast";
import {
  OBLIGATION_OWNER_LOAD_BALANCING_VERSION,
  type ObligationOwnerLoadBalancingPack,
} from "../lib/compliance/obligation-owner-load-balancing";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const peakWeekKey = "2026-06-02";

const capacity: CommitteeObligationCapacityBudgetPack = {
  version: COMMITTEE_OBLIGATION_CAPACITY_BUDGET_VERSION,
  generatedAt: "2026-05-20T00:00:00.000Z",
  orgId: "org-1",
  horizonDays: 90,
  settings: { hoursPerObligation: 2, ownerHoursPerWeek: 8 },
  capacityOwnerCount: 2,
  accountableOwnerCount: 2,
  forecast: {
    version: BOARD_OBLIGATION_FORECAST_VERSION,
    generatedAt: "2026-05-20T00:00:00.000Z",
    orgId: "org-1",
    horizonDays: 90,
    forecastWeekCount: 1,
    weekKeys: [peakWeekKey],
    buckets: [],
    peakWeekKey,
    peakWeekCount: 10,
    totalForecastObligations: 10,
    currentOverdue: 0,
    currentDueSoon: 0,
    committeeSummary: "",
    milestones: [],
  },
  weeks: [
    {
      weekKey: peakWeekKey,
      weekLabel: "peak",
      isCurrentWeek: false,
      obligationCount: 10,
      overdueCount: 0,
      estimatedOwnerHours: 20,
      availableOwnerHours: 16,
      shortfallHours: 4,
      utilizationPercent: 125,
      isShortfall: true,
    },
  ],
  shortfallWeekCount: 1,
  peakShortfallHours: 4,
  peakShortfallWeekKey: peakWeekKey,
  totalEstimatedHours: 20,
  totalAvailableHours: 16,
  committeeSummary: "",
};

const loadBalance: ObligationOwnerLoadBalancingPack = {
  version: OBLIGATION_OWNER_LOAD_BALANCING_VERSION,
  generatedAt: "2026-05-20T00:00:00.000Z",
  orgId: "org-1",
  horizonDays: 90,
  hoursPerObligation: 2,
  peakWeekKey,
  peakWeekLabel: "peak",
  peakWeekObligationCount: 10,
  frameworkOwners: [],
  assignments: [],
  ownerLoads: [
    { userId: "a", label: "Alice", peakWeekObligationCount: 8, estimatedHours: 16, accountableFrameworks: [] },
    { userId: "b", label: "Bob", peakWeekObligationCount: 2, estimatedHours: 4, accountableFrameworks: [] },
  ],
  imbalanceScore: 6,
  suggestions: [],
  committeeSummary: "",
};

const coincidence = evaluatePeakWeekStaffingCoincidence({ capacity, loadBalance });
assert(coincidence.shouldAlert, "shortfall + imbalance coincide");
assert(coincidence.capacityShortfallHours === 4, "shortfall hours");
assert(coincidence.imbalanceScore === 6, "imbalance");

const noAlert = evaluatePeakWeekStaffingCoincidence({
  capacity: { ...capacity, weeks: [{ ...capacity.weeks[0]!, isShortfall: false, shortfallHours: 0 }] },
  loadBalance,
});
assert(!noAlert.shouldAlert, "no shortfall means no alert");

assert(PEAK_WEEK_STAFFING_DIGEST_VERSION.length > 0, "version");

assert(
  isPathAllowedForAuditor("/governance/compliance/peak-week-staffing-digest"),
  "auditor path",
);

console.log("test-peak-week-staffing-digest: ok");
