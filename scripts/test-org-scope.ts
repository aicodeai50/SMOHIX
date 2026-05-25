import { orgScopeOrFilter } from "../lib/org/scope";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const filter = orgScopeOrFilter("user-abc", "org-xyz");
assert(filter === "org_id.eq.org-xyz,and(org_id.is.null,user_id.eq.user-abc)", "org scope filter");
assert(orgScopeOrFilter("user-abc", null) === null, "null org returns null");

console.log("test-org-scope: all checks passed");
