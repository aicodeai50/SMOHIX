import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Optional local PostgreSQL/WASM test runtime; never connects to a live database.
const runtimePath = process.env.SMOHIX_POLICY_TEST_RUNTIME;
if (!runtimePath) throw new Error("Set SMOHIX_POLICY_TEST_RUNTIME to the local PGlite dist/index.js file.");
const { PGlite } = await import(pathToFileURL(runtimePath).href);
const db = new PGlite();
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner = uid(1), operator = uid(2), reviewer = uid(3), security = uid(4), outsider = uid(5);
const orgA = uid(101), orgB = uid(102);
const resources = ["incidents", "services", "automation_dry_runs", "automation_executions", "service_slos", "error_budget_windows", "service_dependencies", "approval_requests", "policy_suggestions", "copilot_threads", "automation_policy_versions", "api_keys", "alert_ingest_tokens", "audit_log", "subscriptions"];
try {
  await db.exec(`create role authenticated; create role anon; create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to authenticated;
    create table public.profiles(id uuid primary key);
    create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;`);
  for (const table of resources) {
    await db.exec(`create table public.${table}(id uuid primary key default gen_random_uuid(), user_id uuid, org_id uuid, status text default 'pending', updated_at timestamptz default now(), created_at timestamptz default now(), action_label text, policy_hint text, decision_brief_json jsonb, requester_id uuid, decided_by uuid);
      alter table public.${table} enable row level security;
      create policy legacy_owner on public.${table} for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());`);
  }
  await db.exec(`create table public.copilot_messages(id uuid primary key default gen_random_uuid(), thread_id uuid);
    alter table public.copilot_messages enable row level security;
    create policy legacy_message on public.copilot_messages for all to authenticated using (true) with check (true);`);
  await db.exec(await readFile("supabase/migrations/20260526120000_org_rbac.sql", "utf8"));
  // Existing organization grants; the migration must restrict, not replace them.
  for (const table of resources.filter((name) => !["approval_requests", "policy_suggestions"].includes(name))) {
    await db.exec(`create policy existing_org on public.${table} for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));`);
  }
  await db.exec(await readFile("supabase/migrations/20261017220000_workspace_boundary_guards.sql", "utf8"));
  await db.exec("grant select, insert, update, delete on all tables in schema public to authenticated;");
  await db.query("insert into auth.users(id,email) values ($1,'Target@Example.test')", [uid(999)]);
  await db.exec("set role service_role;");
  let lookup = await db.query("select public.find_workspace_member_account(' target@example.test ') as id");
  assert.equal(lookup.rows[0].id, uid(999), "server directory lookup is case insensitive");
  await db.exec("reset role; set role authenticated;");
  await assert.rejects(db.query("select public.find_workspace_member_account('target@example.test')"));
  await db.exec("reset role; set role anon;");
  await assert.rejects(db.query("select public.find_workspace_member_account('target@example.test')"));
  await db.exec("reset role;");
  for (let i = 1; i <= 5; i++) await db.query("insert into profiles(id) values ($1)", [uid(i)]);
  await db.query("insert into organizations(id,name,created_by) values ($1,'A',$3),($2,'B',$3)", [orgA, orgB, owner]);
  await db.query("insert into organization_members(org_id,user_id,role) values ($1,$2,'owner'),($1,$3,'operator'),($1,$4,'approver'),($1,$5,'security_reviewer'),($6,$2,'owner')", [orgA, owner, operator, reviewer, security, orgB]);
  await db.query("insert into incidents(id,user_id,org_id) values ($1,$4,$5),($2,$4,$6),($3,$4,null)", [uid(201), uid(202), uid(203), operator, orgA, orgB]);
  await db.query("insert into copilot_threads(id,user_id,org_id) values ($1,$3,$4),($2,$3,$5)", [uid(301), uid(302), operator, orgA, orgB]);
  await db.query("insert into copilot_messages(id,thread_id) values ($1,$3),($2,$4)", [uid(401), uid(402), uid(301), uid(302)]);
  const acting = async (user, sql, params = []) => {
    await db.exec("begin; set local role authenticated;");
    try {
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
      const result = await db.query(sql, params);
      await db.exec("commit;");
      return result;
    } catch (error) { await db.exec("rollback;"); throw error; }
  };
  let result = await acting(operator, "select id from incidents order by id");
  assert.deepEqual(result.rows.map((row) => row.id), [uid(201), uid(203)], "creator cannot read other organization's record");
  result = await acting(operator, "select id from copilot_messages order by id");
  assert.deepEqual(result.rows.map((row) => row.id), [uid(401)], "messages inherit thread membership");
  await db.query("update organization_members set role='viewer' where org_id=$1 and user_id=$2", [orgA, operator]);
  result = await acting(operator, "update incidents set status='resolved' where id=$1 returning id", [uid(201)]);
  assert.equal(result.rows.length, 0, "demoted creator cannot update organization incident");
  result = await acting(owner, "update organization_members set role='viewer' where org_id=$1 and user_id=$2 returning user_id", [orgA, owner]);
  assert.equal(result.rows.length, 0, "owner cannot be demoted");
  await assert.rejects(acting(owner, "update organization_members set role='owner' where org_id=$1 and user_id=$2", [orgA, operator]));
  await assert.rejects(acting(owner, "update organization_members set org_id=$1 where org_id=$2 and user_id=$3", [orgB, orgA, operator]));
  await assert.rejects(acting(operator, "insert into approval_requests(user_id,org_id,requester_id) values ($1,$2,$1)", [operator, orgA]));
  await db.query("update organization_members set role='operator' where org_id=$1 and user_id=$2", [orgA, operator]);
  const makeApproval = async (n, requester, risk = 50) => {
    await db.query("insert into approval_requests(id,user_id,org_id,requester_id,action_label,policy_hint,decision_brief_json) values ($1,$2,$3,$2,'Restart staging','Review',$4)", [uid(n), requester, orgA, JSON.stringify({ riskScore: risk })]);
  };
  await makeApproval(501, operator);
  result = await acting(reviewer, "update approval_requests set status='approved',decided_by=$1 where id=$2 returning id", [reviewer, uid(501)]);
  assert.equal(result.rows.length, 1, "delegated approval can leave pending status");
  result = await acting(reviewer, "update approval_requests set status='denied',decided_by=$1 where id=$2 returning id", [reviewer, uid(501)]);
  assert.equal(result.rows.length, 0, "completed request cannot be decided again");
  await makeApproval(502, reviewer);
  await assert.rejects(acting(reviewer, "update approval_requests set status='approved',decided_by=$1 where id=$2", [reviewer, uid(502)]));
  await makeApproval(503, operator, 50);
  await assert.rejects(acting(security, "update approval_requests set status='approved',decided_by=$1 where id=$2", [security, uid(503)]));
  await makeApproval(504, operator, 75);
  result = await acting(security, "update approval_requests set status='approved',decided_by=$1 where id=$2 returning id", [security, uid(504)]);
  assert.equal(result.rows.length, 1, "security reviewer can decide high risk");
  await makeApproval(505, operator);
  await assert.rejects(acting(reviewer, "update approval_requests set action_label='Different action',status='approved',decided_by=$1 where id=$2", [reviewer, uid(505)]));
  result = await acting(outsider, "select id from approval_requests");
  assert.equal(result.rows.length, 0);
  await db.query("delete from organization_members where org_id=$1 and user_id=$2", [orgA, operator]);
  result = await acting(operator, "select id from incidents order by id");
  assert.deepEqual(result.rows.map((row) => row.id), [uid(203)], "revoked creator retains only personal rows");
  result = await acting(operator, "select id from copilot_messages");
  assert.equal(result.rows.length, 0, "revoked thread creator loses message access");
  result = await acting(owner, "select create_organization_for_user('Bootstrap works') as id");
  assert.ok(result.rows[0].id, "owner bootstrap RPC still works");
  console.log("test-workspace-database: PostgreSQL migration and access checks passed");
} finally { await db.close(); }
