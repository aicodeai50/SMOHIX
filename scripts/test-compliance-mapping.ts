import { complianceControlsForAuditEvent } from "../lib/compliance/map-audit";
import { complianceControlsForAcceptedPolicy } from "../lib/compliance/map-policy";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const approval = complianceControlsForAuditEvent("approval.approved");
assert(approval.some((c) => c.ref === "CC8.1"), "approval maps to change control");

const incident = complianceControlsForAuditEvent("incident.status_updated");
assert(incident.some((c) => c.ref === "CC7.4"), "incident maps to IR control");

const policy = complianceControlsForAcceptedPolicy({
  playbookId: "pb-restart",
  maxBlastRadius: "service",
  requireDryRunFresh: true,
  requireChangeWindow: true,
  suggestionIds: ["s1"],
});
assert(policy.some((c) => c.ref === "CC8.1"), "accepted policy maps dry-run/change window");

const unknown = complianceControlsForAuditEvent("custom.unknown.event");
assert(unknown.length === 0, "unknown events have no mapped controls");

console.log("test-compliance-mapping: all checks passed");
