import { startOfUtcWeek } from "../lib/compliance/board-obligation-forecast";
import {
  OBLIGATION_STAFFING_ACTION_TRACKER_VERSION,
  type ObligationStaffingActionTrackerPack,
} from "../lib/compliance/obligation-staffing-action-tracker";
import {
  buildStaffingCompletionRollupFromTracker,
  buildStaffingCompletionRollupHtml,
  staffingCompletionPeriodKey,
  staffingCompletionRollupToCsv,
  STAFFING_COMPLETION_ROLLUP_VERSION,
} from "../lib/compliance/staffing-completion-rollup";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const tracker: ObligationStaffingActionTrackerPack = {
  version: OBLIGATION_STAFFING_ACTION_TRACKER_VERSION,
  generatedAt: "2026-05-25T12:00:00.000Z",
  orgId: "org-1",
  horizonDays: 90,
  peakWeekKey: startOfUtcWeek("2026-06-02T00:00:00.000Z"),
  stats: { proposed: 1, accepted: 1, inProgress: 0, completed: 1, dismissed: 0, open: 1 },
  items: [
    {
      proposal: {
        actionKey: "lb:ob-1",
        actionType: "load_balance",
        title: "Reassign SOC evidence",
        peakWeekKey: "2026-06-02",
        sourceDetail: "Rebalance",
        obligationId: "ob-1",
        fromOwnerLabel: "Alice",
        toOwnerLabel: "Bob",
        whatifScenarioId: null,
        suggestedAssigneeUserId: "b",
      },
      tracked: {
        id: "a1",
        orgId: "org-1",
        actionKey: "lb:ob-1",
        actionType: "load_balance",
        title: "Reassign SOC evidence",
        status: "completed",
        peakWeekKey: "2026-06-02",
        sourceDetail: null,
        obligationId: "ob-1",
        fromOwnerLabel: "Alice",
        toOwnerLabel: "Bob",
        whatifScenarioId: null,
        assigneeUserId: "b",
        operatorNote: null,
        createdAt: "2026-05-01T00:00:00.000Z",
        updatedAt: "2026-05-10T00:00:00.000Z",
        completedAt: "2026-05-10T00:00:00.000Z",
      },
      status: "completed",
      isOpen: false,
    },
    {
      proposal: {
        actionKey: "lb:ob-2",
        actionType: "load_balance",
        title: "Reassign ISO control",
        peakWeekKey: "2026-06-02",
        sourceDetail: "Rebalance",
        obligationId: "ob-2",
        fromOwnerLabel: "Bob",
        toOwnerLabel: "Alice",
        whatifScenarioId: null,
        suggestedAssigneeUserId: "a",
      },
      tracked: {
        id: "a2",
        orgId: "org-1",
        actionKey: "lb:ob-2",
        actionType: "load_balance",
        title: "Reassign ISO control",
        status: "accepted",
        peakWeekKey: "2026-06-02",
        sourceDetail: null,
        obligationId: "ob-2",
        fromOwnerLabel: "Bob",
        toOwnerLabel: "Alice",
        whatifScenarioId: null,
        assigneeUserId: "a",
        operatorNote: null,
        createdAt: "2026-05-02T00:00:00.000Z",
        updatedAt: "2026-05-02T00:00:00.000Z",
        completedAt: null,
      },
      status: "accepted",
      isOpen: true,
    },
    {
      proposal: {
        actionKey: "capacity_whatif:defer",
        actionType: "capacity_whatif",
        title: "Defer 2 weeks",
        peakWeekKey: "2026-06-02",
        sourceDetail: "What-if",
        obligationId: null,
        fromOwnerLabel: null,
        toOwnerLabel: null,
        whatifScenarioId: "defer",
        suggestedAssigneeUserId: null,
      },
      tracked: null,
      status: "proposed",
      isOpen: false,
    },
  ],
  committeeSummary: "",
};

const pack = buildStaffingCompletionRollupFromTracker(tracker, "Acme Corp");
assert(pack.trackedCount === 2, "tracked count");
assert(pack.completedCount === 1, "completed count");
assert(pack.openCount === 1, "open count");
assert(pack.completionPercent === 50, "50% completion");
assert(pack.version === STAFFING_COMPLETION_ROLLUP_VERSION, "version");

const html = buildStaffingCompletionRollupHtml(pack);
assert(html.includes("Staffing action completion rollup"), "html title");
assert(html.includes("Open actions"), "open section");
assert(html.includes("Save as PDF"), "print hint");

const csv = staffingCompletionRollupToCsv(pack);
assert(csv.includes("section,status"), "csv header");
assert(csv.includes("open,accepted"), "open section row");

const period = staffingCompletionPeriodKey(new Date("2026-05-25T12:00:00.000Z"));
assert(period.startsWith("week:"), "period key");

assert(
  isPathAllowedForAuditor("/governance/compliance/staffing-completion-rollup"),
  "auditor path",
);

console.log("test-staffing-completion-rollup: ok");
