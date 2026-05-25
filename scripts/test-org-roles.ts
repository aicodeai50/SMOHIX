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
