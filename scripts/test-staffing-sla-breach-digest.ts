import { startOfUtcWeek } from "../lib/compliance/board-obligation-forecast";
import type { StaffingActionRow } from "../lib/compliance/obligation-staffing-action-tracker";
import {
  buildStaffingSlaBreachDigestFromParts,
  collectStaffingSlaBreachActions,
  DEFAULT_STAFFING_SLA_DAYS_AFTER_PEAK_WEEK,
  isStaffingActionSlaBreach,
  staffingSlaBreachPeriodKey,
  STAFFING_ACTION_SLA_BREACH_DIGEST_VERSION,
} from "../lib/compliance/staffing-action-sla-breach-digest";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const peakWeekKey = startOfUtcWeek("2026-01-08T00:00:00.000Z");
const now = new Date("2026-05-24T12:00:00.000Z");
const slaDays = 7;

const breachAction: StaffingActionRow = {
  id: "act-1",
  orgId: "org-1",
  actionKey: "lb:ob-1",
  actionType: "load_balance",
  title: "Reassign SOC evidence",
  status: "accepted",
  peakWeekKey,
  sourceDetail: null,
  obligationId: "ob-1",
  fromOwnerLabel: "Alice",
  toOwnerLabel: "Bob",
  whatifScenarioId: null,
  assigneeUserId: "user-b",
  operatorNote: null,
  createdAt: "2026-01-10T00:00:00.000Z",
  updatedAt: "2026-01-10T00:00:00.000Z",
  completedAt: null,
};

const overdueInSla: StaffingActionRow = {
  ...breachAction,
  id: "act-2",
  peakWeekKey: startOfUtcWeek("2026-05-12T00:00:00.000Z"),
  status: "in_progress",
};

const completedAction: StaffingActionRow = {
  ...breachAction,
  id: "act-3",
  status: "completed",
};

assert(isStaffingActionSlaBreach(breachAction, slaDays, now), "past SLA is breach");
assert(!isStaffingActionSlaBreach(overdueInSla, slaDays, now), "recent overdue not breach");
assert(!isStaffingActionSlaBreach(completedAction, slaDays, now), "completed not breach");

const breaches = collectStaffingSlaBreachActions(
  [breachAction, overdueInSla, completedAction],
  slaDays,
  now,
);
assert(breaches.length === 1, "one breach");
assert(breaches[0]!.daysPastSla > 0, "days past SLA");

const pack = buildStaffingSlaBreachDigestFromParts({
  orgId: "org-1",
  settings: {
    digestEnabled: true,
    emailEnabled: true,
    slaDaysAfterPeakWeek: slaDays,
  },
  actions: [breachAction, overdueInSla],
  now,
});
assert(pack.breachItems.length === 1, "pack breach count");
assert(pack.overdueNotYetBreachCount === 1, "in SLA window");
assert(pack.version === STAFFING_ACTION_SLA_BREACH_DIGEST_VERSION, "version");
assert(pack.settings.slaDaysAfterPeakWeek === DEFAULT_STAFFING_SLA_DAYS_AFTER_PEAK_WEEK, "default sla");

const period = staffingSlaBreachPeriodKey(now);
assert(period.startsWith("week:"), "period key");

assert(
  isPathAllowedForAuditor("/governance/compliance/staffing-sla-breach-digest"),
  "auditor path",
);

console.log("test-staffing-sla-breach-digest: ok");
