import {
  buildAssessmentExceptionEntry,
  buildComplianceExceptionRegisterPackFromParts,
  buildPolicyExceptionEntry,
  buildRemediationExceptionEntry,
  daysUntil,
  exceptionIdForAssessment,
  mergeExceptionRows,
  resolveExceptionStatus,
  severityFromAssessmentReason,
} from "../lib/compliance/compliance-exception-register";
import type { PolicyDriftFinding } from "../lib/compliance/policy-drift";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(severityFromAssessmentReason("No audit or policy evidence") === "high", "high severity");
assert(exceptionIdForAssessment("soc2", "CC6.1", "test").startsWith("assessment:soc2:"), "assessment id");

const assessment = buildAssessmentExceptionEntry({
  framework: "soc2",
  controlRef: "CC6.1",
  title: "Logical access",
  reason: "Partial evidence",
  periodDays: 30,
  approverUserId: "u1",
  approverLabel: "Owner",
  generatedAt: new Date().toISOString(),
});

assert(assessment.status === "open", "open assessment");
assert(assessment.gapKey !== null, "gap key");

const finding: PolicyDriftFinding = {
  id: "drift-1",
  playbookId: "pb-test",
  severity: "high",
  kind: "missing_dry_run_fresh",
  title: "Missing dry-run",
  detail: "Guardrail gap",
  controlIds: ["soc2:CC8.1"],
  framework: "soc2",
  acceptedAt: new Date().toISOString(),
  href: "/governance/compliance/policy-drift",
};

const policy = buildPolicyExceptionEntry(finding, new Date().toISOString());
assert(policy !== null && policy.type === "policy_drift", "policy entry");

const remediation = buildRemediationExceptionEntry(
  {
    id: "rem-1",
    gapKey: assessment.gapKey!,
    framework: "soc2",
    controlRef: "CC6.1",
    title: assessment.title,
    reason: assessment.reason,
    status: "dismissed",
    updatedAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
    resolvedBy: "u2",
    createdBy: "u1",
  },
  [{ userId: "u2", role: "admin", email: "a@test", displayName: "Admin" }],
);

assert(remediation.status === "approved", "dismissed approved");

const merged = mergeExceptionRows([assessment], policy ? [policy] : [], [remediation]);
assert(merged.length === 2, "dedupe assessment into remediation");

const expired = resolveExceptionStatus("open", new Date(Date.now() - 86_400_000).toISOString());
assert(expired === "expired", "expired status");

assert(daysUntil(new Date(Date.now() + 5 * 86_400_000).toISOString()) >= 4, "days until");

const pack = buildComplianceExceptionRegisterPackFromParts({
  orgId: "org-1",
  periodDays: 30,
  rows: merged,
});

assert(pack.totalCount === merged.length, "pack count");

assert(isPathAllowedForAuditor("/governance/compliance/exception-register"), "auditor path");

console.log("test-compliance-exception-register: all checks passed");
