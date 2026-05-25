import { applyUserOrOrgScope } from "../lib/org/apply-scope-query";
import { orgScopeOrFilter } from "../lib/org/scope";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const filter = orgScopeOrFilter("user-abc", "org-xyz");
assert(filter === "org_id.eq.org-xyz,and(org_id.is.null,user_id.eq.user-abc)", "org scope filter");
assert(orgScopeOrFilter("user-abc", null) === null, "null org returns null");

const mockQuery = {
  filters: [] as string[],
  or(filter: string) {
    this.filters.push(`or:${filter}`);
    return this;
  },
  eq(column: string, value: string) {
    this.filters.push(`eq:${column}=${value}`);
    return this;
  },
};

const scoped = applyUserOrOrgScope({ ...mockQuery, filters: [] as string[] }, "user-abc", "org-xyz");
assert(scoped.filters[0]?.startsWith("or:org_id.eq.org-xyz"), "applyUserOrOrgScope uses org filter");

const personal = applyUserOrOrgScope({ ...mockQuery, filters: [] as string[] }, "user-abc", null);
assert(personal.filters[0] === "eq:user_id=user-abc", "applyUserOrOrgScope falls back to user_id");

console.log("test-org-slo-scope: all checks passed");
