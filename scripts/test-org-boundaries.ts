import { listAcceptedPolicyGuardrailsForPlaybook } from "../lib/approvals/policy-suggestions";
import { getSubscriptionSummary } from "../lib/billing/plan";
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { applyUserOrOrgScope } from "../lib/org/apply-scope-query";
import { findMemberAccount } from "../lib/org/member-directory";
import { updateOrgMemberRole, removeOrgMember } from "../lib/org/data";

type ScopeQuery = PromiseLike<unknown> & {
  or(filter: string): ScopeQuery;
  eq(column: string, value: string): ScopeQuery;
  is(column: string, value: null): ScopeQuery;
};

async function main() {
  const requests: URL[] = [];
  let reply: unknown[] = [];
  let fail = false;
  const client: SupabaseClient = createClient("https://workspace.invalid", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input) => {
      requests.push(new URL(String(input)));
      return new Response(JSON.stringify(fail ? { message: "private database failure", code: "42501" } : reply), {
        status: fail ? 403 : 200, headers: { "Content-Type": "application/json" },
      });
    } },
  });
  await applyUserOrOrgScope(client.from("incidents").select("id") as unknown as ScopeQuery, "person-a", "org-a");
  assert.equal(requests.at(-1)?.searchParams.get("or"), "(org_id.eq.org-a,and(org_id.is.null,user_id.eq.person-a))");
  await applyUserOrOrgScope(client.from("incidents").select("id") as unknown as ScopeQuery, "person-a", null);
  assert.equal(requests.at(-1)?.searchParams.get("user_id"), "eq.person-a");
  assert.equal(requests.at(-1)?.searchParams.get("org_id"), "is.null");

  await listAcceptedPolicyGuardrailsForPlaybook(client, "person-a", "restart", "org-a");
  assert.equal(requests.at(-1)?.searchParams.get("or"), "(org_id.eq.org-a,and(org_id.is.null,user_id.eq.person-a))", "accepted policy follows current workspace");
  await getSubscriptionSummary(client, "person-a", "org-a");
  assert.equal(requests.at(-1)?.searchParams.get("or"), "(org_id.eq.org-a,and(org_id.is.null,user_id.eq.person-a))", "billing follows current workspace");
  const mutationStart = requests.length;
  // Real Supabase mutation builders: zero affected rows, protected owners and failed writes.
  assert.equal((await updateOrgMemberRole("org-a", "member-a", "viewer", { supabase: client })).ok, false);
  assert.equal((await removeOrgMember("org-a", "member-a", { supabase: client })).ok, false);
  reply = [{ user_id: "member-a" }];
  assert.equal((await updateOrgMemberRole("org-a", "member-a", "viewer", { supabase: client })).ok, true);
  assert.equal((await removeOrgMember("org-a", "member-a", { supabase: client })).ok, true);
  for (const url of requests.slice(mutationStart)) {
    assert.equal(url.searchParams.get("org_id"), "eq.org-a");
    assert.equal(url.searchParams.get("user_id"), "eq.member-a");
    assert.equal(url.searchParams.get("role"), "neq.owner");
  }
  const before = requests.length;
  assert.equal((await updateOrgMemberRole("org-a", "member-a", "owner", { supabase: client })).ok, false);
  assert.equal(requests.length, before, "owner assignment never reaches database");
  reply = [{ user_id: "another-member" }];
  assert.equal((await removeOrgMember("org-a", "member-a", { supabase: client })).ok, false);
  fail = true;
  assert.equal((await updateOrgMemberRole("org-a", "member-a", "viewer", { supabase: client })).ok, false);

  const fullPage = Array.from({ length: 200 }, (_, i) => ({ id: `user-${i}`, email: `user-${i}@example.test` }));
  let pages = 0;
  const match = await findMemberAccount(" TARGET@example.test ", async (page) => {
    pages++;
    return { data: { users: page === 1 ? fullPage : [{ id: "target", email: "target@example.test" }] }, error: null };
  });
  assert.deepEqual(match, { userId: "target", complete: true });
  assert.equal(pages, 2, "searches beyond first 200 accounts");
  assert.deepEqual(await findMemberAccount("missing@example.test", async () => ({ data: { users: [] }, error: null })), { userId: null, complete: true });
  assert.deepEqual(await findMemberAccount("missing@example.test", async () => ({ data: { users: [] }, error: new Error("private") })), { userId: null, complete: false });
  pages = 0;
  assert.deepEqual(await findMemberAccount("missing@example.test", async () => { pages++; return { data: { users: fullPage }, error: null }; }), { userId: null, complete: false });
  assert.equal(pages, 10, "directory lookup has a fixed bound");
  console.log("test-org-boundaries: all checks passed");
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
