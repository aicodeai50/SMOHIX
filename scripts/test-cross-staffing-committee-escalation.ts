import { startOfUtcWeek } from "../lib/compliance/board-obligation-forecast";
import {
  buildCrossStaffingCommitteeEscalationFromParts,
  crossStaffingEscalationPeriodKey,
  CROSS_STAFFING_COMMITTEE_ESCALATION_VERSION,
} from "../lib/compliance/cross-staffing-committee-escalation";
import type { StaffingActionRow } from "../lib/compliance/obligation-staffing-action-tracker";
import {
  collectStaffingSlaBreachActions,
  isStaffingActionSlaBreach,
} from "../lib/compliance/staffing-action-sla-breach-digest";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const peakWeekKey = startOfUtcWeek("2026-01-08T00:00:00.000Z");
const now = new Date("2026-05-24T12:00:00.000Z");
const slaDays = 7;
const periodKey = crossStaffingEscalationPeriodKey(now);

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

assert(isStaffingActionSlaBreach(breachAction, slaDays, now), "breach for escalation");

const breaches = collectStaffingSlaBreachActions([breachAction], slaDays, now);
assert(breaches.length === 1, "one breach");

const rollupDelivery = {
  id: "rollup-1",
  periodKey,
  openCount: 3,
  trackedCount: 5,
  completionPercent: 40,
  emailsSent: 2,
  deliveryStatus: "sent",
};

const eligiblePack = buildCrossStaffingCommitteeEscalationFromParts({
  orgId: "org-1",
  settings: { escalationEnabled: true, emailEnabled: true, slaDaysAfterPeakWeek: slaDays },
  breachItems: breaches,
  rollupDelivery,
  periodKey,
  now,
});
assert(eligiblePack.escalationEligible, "eligible after rollup email");
assert(eligiblePack.breachItems.length === 1, "pack breaches");
assert(eligiblePack.version === CROSS_STAFFING_COMMITTEE_ESCALATION_VERSION, "version");

const pendingRollup = buildCrossStaffingCommitteeEscalationFromParts({
  orgId: "org-1",
  settings: { escalationEnabled: true, emailEnabled: true, slaDaysAfterPeakWeek: slaDays },
  breachItems: breaches,
  rollupDelivery: null,
  periodKey,
  now,
});
assert(!pendingRollup.escalationEligible, "not eligible without rollup");

const noEmailRollup = buildCrossStaffingCommitteeEscalationFromParts({
  orgId: "org-1",
  settings: { escalationEnabled: true, emailEnabled: true, slaDaysAfterPeakWeek: slaDays },
  breachItems: breaches,
  rollupDelivery: { ...rollupDelivery, emailsSent: 0 },
  periodKey,
  now,
});
assert(!noEmailRollup.escalationEligible, "not eligible without rollup email");

assert(periodKey.startsWith("week:"), "period key");

assert(
  isPathAllowedForAuditor("/governance/compliance/cross-staffing-committee-escalation"),
  "auditor path",
);

console.log("test-cross-staffing-committee-escalation: ok");
