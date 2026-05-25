import {
  computeStaffingTrackerStats,
  loadBalanceActionKey,
  mergeStaffingTrackerItems,
  proposalsFromLoadBalancing,
  proposalsFromWhatIf,
  whatIfActionKey,
  OBLIGATION_STAFFING_ACTION_TRACKER_VERSION,
} from "../lib/compliance/obligation-staffing-action-tracker";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const proposals = [
  ...proposalsFromLoadBalancing({
    peakWeekKey: "2026-06-02",
    suggestions: [
      {
        obligationId: "ob-1",
        obligationTitle: "SOC evidence",
        framework: "soc2",
        fromOwnerUserId: "a",
        fromOwnerLabel: "Alice",
        toOwnerUserId: "b",
        toOwnerLabel: "Bob",
        reason: "Rebalance peak week",
      },
    ],
  }),
  ...proposalsFromWhatIf({
    peakWeekKey: "2026-06-02",
    results: [
      {
        scenarioId: "defer-2w",
        title: "Defer 2 weeks",
        summary: "Slip program",
        peakWeekDelta: -3,
      },
    ],
  }),
];

assert(proposals.length === 2, "two proposals");
assert(loadBalanceActionKey("ob-1") === "load_balance:ob-1", "load key");
assert(whatIfActionKey("defer-2w") === "capacity_whatif:defer-2w", "whatif key");

const items = mergeStaffingTrackerItems({
  proposals,
  tracked: [
    {
      id: "row-1",
      orgId: "org-1",
      actionKey: loadBalanceActionKey("ob-1"),
      actionType: "load_balance",
      title: "SOC evidence",
      status: "in_progress",
      peakWeekKey: "2026-06-02",
      sourceDetail: "Rebalance",
      obligationId: "ob-1",
      fromOwnerLabel: "Alice",
      toOwnerLabel: "Bob",
      whatifScenarioId: null,
      assigneeUserId: "b",
      operatorNote: null,
      createdAt: "2026-05-20T00:00:00.000Z",
      updatedAt: "2026-05-20T00:00:00.000Z",
      completedAt: null,
    },
  ],
});

assert(items[0]!.status === "proposed" || items.some((i) => i.status === "in_progress"), "merged");
const stats = computeStaffingTrackerStats(items);
assert(stats.proposed >= 1, "has proposed");
assert(stats.inProgress >= 1, "has in progress");
assert(stats.open >= 2, "open count");

assert(OBLIGATION_STAFFING_ACTION_TRACKER_VERSION.length > 0, "version");

assert(
  isPathAllowedForAuditor("/governance/compliance/staffing-actions"),
  "auditor path",
);

console.log("test-obligation-staffing-action-tracker: ok");
