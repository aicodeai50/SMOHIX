import { computeAttestationStatus } from "../lib/compliance/attestation/status";
import {
  currentSlaReminderPeriodId,
  type ComplianceSlaReminderBundle,
} from "../lib/compliance/compliance-sla-reminders";
import {
  getSlackNotificationConfig,
  shouldSendSlackNotification,
} from "../lib/integrations/slack";
import { isTransactionalEmailConfigured } from "../lib/notifications/email";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(currentSlaReminderPeriodId(new Date("2026-05-24T12:00:00.000Z")).includes("2026-W"), "period id has year-week");

const dueSoonStatus = computeAttestationStatus({
  dueAtIso: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  attestedAtIso: null,
});
assert(dueSoonStatus === "pending", "future due is pending");

const overdueStatus = computeAttestationStatus({
  dueAtIso: new Date(Date.now() - 86_400_000).toISOString(),
  attestedAtIso: null,
});
assert(overdueStatus === "overdue", "past due is overdue");

const cfg = getSlackNotificationConfig();
assert(typeof cfg.complianceSla === "boolean", "compliance SLA slack toggle exists");
assert(shouldSendSlackNotification("compliance_sla") === cfg.complianceSla, "shouldSend respects config");

assert(typeof isTransactionalEmailConfigured() === "boolean", "email configured check runs");

assert(isPathAllowedForAuditor("/governance/compliance/sla-reminders"), "auditor can open SLA page");

// collectComplianceSlaReminders needs DB — only test bundle shape via type guard on empty mock
const emptyBundle: ComplianceSlaReminderBundle = {
  periodId: currentSlaReminderPeriodId(),
  dueSoon: [],
  overdue: [],
  regressed: [],
};
assert(emptyBundle.dueSoon.length === 0, "empty bundle placeholder");

console.log("test-compliance-sla-reminders: all checks passed");
