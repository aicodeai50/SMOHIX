import { approvalDecisionAccess } from "../lib/approvals/decision-access";
import { canDecideApproval, canReviewPolicy, isReadOnlyAuditorRole } from "../lib/org/roles";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(canDecideApproval("approver", 50), "approver decides medium risk");
assert(!canDecideApproval("security_reviewer", 50), "security reviewer skips medium");
assert(canDecideApproval("security_reviewer", 75), "security reviewer decides high");
assert(canReviewPolicy("security_reviewer"), "security reviewer reviews policy");
assert(!canReviewPolicy("operator"), "operator cannot review policy");
assert(isReadOnlyAuditorRole("auditor"), "auditor is read-only");
assert(!isReadOnlyAuditorRole("admin"), "admin is not read-only auditor");

console.log("test-org-roles: all checks passed");

// The displayed permission and server decision use this same policy.

const base = { status: "pending", userId: "reviewer", ownerId: "author", requesterId: "author", requestOrgId: "org-a", activeOrgId: "org-a", role: "approver" as const, riskScore: 50 };
assert(approvalDecisionAccess(base).allowed, "matching delegated reviewer allowed");
assert(!approvalDecisionAccess({ ...base, activeOrgId: "org-b" }).allowed, "other workspace denied");
assert(!approvalDecisionAccess({ ...base, activeOrgId: null, role: null }).allowed, "revoked membership denied");
assert(!approvalDecisionAccess({ ...base, role: null }).allowed, "missing current role denied");
assert(!approvalDecisionAccess({ ...base, requesterId: "reviewer" }).allowed, "organization self approval denied");
assert(!approvalDecisionAccess({ ...base, role: "viewer" }).allowed, "viewer denied");
assert(!approvalDecisionAccess({ ...base, role: "security_reviewer" }).allowed, "security review requires high risk");
assert(approvalDecisionAccess({ ...base, role: "security_reviewer", riskScore: 75 }).allowed, "high risk reviewer allowed");
assert(!approvalDecisionAccess({ ...base, status: "approved" }).allowed, "completed decision denied");
assert(approvalDecisionAccess({ ...base, requestOrgId: null, ownerId: "reviewer" }).allowed, "legacy personal owner remains allowed");
assert(!approvalDecisionAccess({ ...base, requestOrgId: null }).allowed, "other personal owner denied");
console.log("approval decision access: all checks passed");
