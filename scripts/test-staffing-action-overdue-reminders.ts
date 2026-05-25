import { startOfUtcWeek } from "../lib/compliance/board-obligation-forecast";
import type { StaffingActionRow } from "../lib/compliance/obligation-staffing-action-tracker";
import {
  buildStaffingOverdueRemindersFromParts,
  collectOverdueStaffingActions,
  daysPastPeakWeek,
  endOfUtcWeekIso,
  isStaffingActionOverdue,
  staffingOverdueReminderKey,
  STAFFING_ACTION_OVERDUE_REMINDERS_VERSION,
} from "../lib/compliance/staffing-action-overdue-reminders";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const peakWeekKey = startOfUtcWeek("2026-01-08T00:00:00.000Z");
const now = new Date("2026-05-24T12:00:00.000Z");

const overdueAction: StaffingActionRow = {
  id: "act-1",
  orgId: "org-1",
  actionKey: "lb:ob-1",
  actionType: "load_balance",
  title: "Rebalance Alice → Bob",
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

const completedAction: StaffingActionRow = {
  ...overdueAction,
  id: "act-2",
  status: "completed",
};

const inWindowAction: StaffingActionRow = {
  ...overdueAction,
  id: "act-3",
  peakWeekKey: startOfUtcWeek("2026-05-20T00:00:00.000Z"),
  status: "in_progress",
};

assert(isStaffingActionOverdue(overdueAction, now), "accepted past peak is overdue");
assert(!isStaffingActionOverdue(completedAction, now), "completed not overdue");
assert(!isStaffingActionOverdue(inWindowAction, now), "current peak week not overdue");

const overdue = collectOverdueStaffingActions(
  [overdueAction, completedAction, inWindowAction],
  now,
);
assert(overdue.length === 1, "one overdue");
assert(overdue[0]!.daysPastPeakWeek > 0, "days past peak");

const endIso = endOfUtcWeekIso(peakWeekKey);
assert(endIso.endsWith("Z"), "week end iso");
assert(daysPastPeakWeek(peakWeekKey, now) > 100, "many days past");

const pack = buildStaffingOverdueRemindersFromParts({
  orgId: "org-1",
  settings: { remindersEnabled: true, emailEnabled: true },
  actions: [overdueAction, inWindowAction],
  now,
});
assert(pack.overdueItems.length === 1, "pack overdue count");
assert(pack.openActionCount === 2, "open count");
assert(pack.version === STAFFING_ACTION_OVERDUE_REMINDERS_VERSION, "version");

const key = staffingOverdueReminderKey("act-1", peakWeekKey);
assert(key.includes("act-1"), "reminder key");

assert(
  isPathAllowedForAuditor("/governance/compliance/staffing-action-reminders"),
  "auditor path",
);

console.log("test-staffing-action-overdue-reminders: ok");
