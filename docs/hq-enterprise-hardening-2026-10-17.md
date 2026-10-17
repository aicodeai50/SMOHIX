# Smohix HQ enterprise hardening

Project folder: C:\Users\sandr\OneDrive\Desktop\SMOHIX\SMOHIX

## Implemented

- Checkout accepts bounded, validated plan/top-up input and same-origin browser mutations. Invalid numbers, unexpected identity fields and unsafe approval URLs are rejected.
- Billing no longer renders backend environment-variable instructions or database errors. Failed balance/plan lookups are unavailable, not zero/Free; checkout is withheld while the current plan cannot be verified.
- PayPal and checkout failures reach customers only as safe allowlisted messages. Error redirect URLs contain a fixed code, and the billing page no longer decodes or displays arbitrary provider error text. Payment requests have timeouts. No payment was created, approved or captured during implementation.
- Own API and Identity use their actual public /health endpoints with parsed availability states. A healthy HQ no longer stands in for Own API. Log remains Unknown until a real structured health contract is available; arbitrary HTML is not proof of application health. Public probe output excludes hosts, credentials and raw diagnostics.
- Setup distinguishes failed verification from missing configuration. URL completion hints cannot mark a step complete without verified account evidence. Reachability is required for the connector step, and completing the checklist no longer claims operational readiness.
- Added a public availability history table, server-rendered recent-checks panel and a scheduled recording command. The table contains only product ID, availability state and check timestamp. Direct database access is restricted to the service role; the rendered page exposes only names, states and UTC times. Unknown, missing or stale data cannot be presented as verified uptime.
- The enterprise regression script is included in the normal release gate. Existing organization scope, roles, audit, approvals and operations checks remain in that gate.

## Manual database activation

Do not rerun the complete migration bundle on an existing database. Apply only the new migration through your established Supabase migration process:

`supabase/migrations/20261017193000_public_service_observations.sql`

No database migration was executed by the agent. The regenerated apply-all-migrations.sql is for fresh-project bootstrap only.

## Monitor activation

On a trusted server-side scheduler, run `npm run monitor:record` every minute. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY privately in that scheduler; never expose them in a webpage or paste them into chat. The job reads only the fixed public Smohix status endpoint, validates all six monitored service observations, ignores extra response fields and upserts sanitized samples. It never runs customer remediation or payment operations. Scheduler failures produce generic logs.

The history section remains explicitly unavailable until storage and scheduling are active. No scheduler or database was enabled during source changes. There is no uptime SLA claim, certification claim or automatic retention job. Set and implement the agreed history retention policy before long-term operation; the initial public UI reads only the last 48 hours and at most 200 records.

## Remaining enterprise acceptance work

- Staging tests with two organizations and real authenticated roles, proving data isolation and access removal.
- Incident to runbook to approval to execution to audit tests with real permitted targets, plus failure/recovery paths.
- Backup restoration drill, retention policy and operational alert ownership.
- PayPal sandbox checkout/webhook/subscription lifecycle verification before enabling self-service billing.
- Review and publish SDK/CLI versions and update customer documentation.
- Real health contract for Log, notification subscriptions and a deployment procedure with rollback evidence.

Passing source checks is not evidence that these production acceptance tasks or certifications are complete. This change is prepared in the original HQ folder; it has not been committed, pushed, deployed or applied to Supabase.

## Enterprise release acceptance checklist

Use a staging organization and synthetic data first. Confirm each item with an actor, time, expected result and captured evidence:

1. Create two organizations. Verify no user in one can list, read, modify or export the other's incidents, services, approvals or evidence. Repeat direct API requests, not only UI navigation.
2. Verify owner/admin membership management; operator restrictions; viewer/auditor read-only access; and prompt access removal after revocation. Do not trust profile metadata as an authorization role.
3. Ingest a signed synthetic alert, verify deduplication and service ownership, create a dry-run, request approval and execute only an explicitly permitted staging action. Verify a failed action remains failed and auditable.
4. Verify checkout and webhook handling in the payment sandbox, including cancel, decline, duplicate callback, delayed callback and plan change. Never claim payment success from a return URL alone.
5. Restore a staging backup into an isolated environment and verify database, attachments, organization membership and audit records. Record actual recovery times and data loss; do not invent recovery objectives.
6. Revoke an integration credential, verify it stops working, rotate it, and verify recovery. Ensure secrets and backend errors do not appear in HTML, browser responses, redirect URLs or exports.
7. Confirm public monitoring reports an actual backend outage independently of HQ, records recovery, and alerts a named operator. Treat unavailable monitoring as unknown, not healthy.
8. Confirm an unsuccessful deployment leaves the prior healthy version running, then rehearse rollback. Document the specific release and migration state.

These checks need real staging accounts, configured systems and operator participation. They were not executed against customer production records.

## Source verification results

The 109 configured release check groups reported passing, including the new enterprise checks and existing organization, approval, policy, workflow and governance suites. Follow-up enterprise/status checks passed after the final UI and failure-precedence changes. TypeScript completed without errors. Lint on the changed source completed with zero errors; the migration bundle verifier passed with 57 migrations.

No production browser acceptance test, payment sandbox lifecycle, real monitoring database write or restore exercise was performed. No production build or deployment was performed in this milestone.


## Approval boundary follow-up

The queue and decision action now share a single access policy. Organization requests require a matching active organization and a current decision-capable role, and cannot be decided by their requester. Completed requests and another user's personal requests are denied. Personal requests retain their existing owner workflow. Both paths use the stored decision brief's validated risk score. Queries without an active organization explicitly select personal rows only; personal updates also require a null organization. The workspace cookie is secure in production.

Validation: eleven decision access cases, existing organization roles and operations workflow checks, TypeScript and lint. No deployment or database changes were made. Two-account staging tests and database policy enforcement still need verification; this source change does not establish that every tenant boundary has been audited.


## Workspace isolation and membership follow-up

Fixed broad owner-or-organization queries in billing, Copilot history, API key and ingestion-token lists, automation policies, and incident timelines. A user-created record in another organization no longer joins the active workspace. Without an organization, the shared query helper now explicitly requires a personal row. Incident detail, incident mutations and service deletion also enforce this boundary and verify an affected row. Execution billing, accepted guardrails and remediation dry-run lookup use the verified active organization.

Membership updates/removals confirm the returned member before reporting success. Role changes and removals now append scoped audit events. Creation and all member changes show a safe warning if audit delivery cannot be confirmed; this is not an atomic audit transaction or a retry queue. Member listing failures no longer render a false empty roster. Member lookup pages beyond the first 200 accounts with a fixed 2,000-account bound, and distinguishes an incomplete lookup from an absent account. The migration adds an exact server-only directory lookup for larger directories; the bounded scan is only a compatibility fallback until it is applied. Authenticated customers and anonymous callers cannot invoke the lookup.

Prepared `20261017220000_workspace_boundary_guards.sql`: restrictive database policies prevent older permissive owner policies from bypassing membership and writer-role checks. Record tenant/creator identity cannot be changed by end-user updates. Owner memberships cannot be reassigned/demoted through ordinary clients. Approval decisions enforce requester separation, role and risk rules, immutable request identity/action, and a pending-to-decision transition. The delegated-update policy has an explicit post-update check, fixing its old implicit requirement to remain pending. Message access follows the thread. These policies preserve server maintenance and the owner bootstrap RPC. No existing records are deleted or reassigned.

### Verification and activation

The 110 existing release-check groups passed after the main boundary changes. After the subsequent execution/policy scope fixes, the relevant focused checks, TypeScript, lint and isolated PostgreSQL checks were rerun. `scripts/test-workspace-database.mjs` executes the real migration against an in-memory PostgreSQL runtime with authenticated roles and fixtures; it covers revoked creators, demoted writers, cross-organization records/messages, owner protection, delegated decisions, self-approval, risk restrictions, changed approval actions and owner bootstrap. Its fixture schema is intentionally minimal and does not replace testing against a staging copy of the real schema and data.

Optional local database test runtime (outside the application dependencies):

```powershell
cd "C:\Users\sandr\OneDrive\Desktop\SMOHIX\SMOHIX"
npm.cmd install --prefix "C:\Users\sandr\Documents\Codex\smohix-policy-tests" --no-audit --no-fund --ignore-scripts @electric-sql/pglite
$env:SMOHIX_POLICY_TEST_RUNTIME = "C:\Users\sandr\Documents\Codex\smohix-policy-tests\node_modules\@electric-sql\pglite\dist\index.js"
npm.cmd run test:workspace-database
```

Supabase changes remain manual. From the same HQ folder, inspect `npx supabase migration list --linked` and `npx supabase db push --dry-run` first. Confirm the linked staging project and the entire pending migration list before applying. After staging two-account tests pass, use the normal reviewed production migration/release process. Do not run `apply-all-migrations.sql` on an existing database; that file is fresh-project bootstrap only. The status-history migration from the earlier milestone is also still pending activation.

Nothing in this milestone was committed, pushed, deployed, or applied to a remote database. Production build, authenticated staging journeys, production policy verification, payment-provider lifecycle, backup restore, real monitoring delivery and other acceptance items above remain separate release requirements. Passing local tests is not a claim that the whole ecosystem is finished or certified.


## Live streaming release — October 17

The user authorized production deployment and applying the two checked migrations. The first source snapshot was deployed to Railway service SMOHIX (project independent-tranquility), deployment `f8466c4d-d9d7-4956-af35-f69e52afb72a`, with status SUCCESS. Its production build, TypeScript and health check passed. Live HTTP verification returned 200 for the public HQ pages and health endpoint, sign-in redirects for private pages, and 401 for signed-out key access. The public SSE endpoint returned event-stream headers and two independently refreshed snapshots with all four core products operational; no diagnostic fields were exposed.

Live updates use shared 30-second health probes, SSE heartbeats and bounded connections with periodic renewal. Browser streams pause when hidden, reconnect and fall back to ordinary checks. The status page also receives streamed updates. It retains explicit timestamps and safe delayed/unavailable messages. These checks establish endpoint availability, not the success of every signed-in feature.

The subsequent source release also adds cancellation and a Stop response control for Copilot. Browser cancellation/unmount aborts upstream requests; interrupted model streams cannot be marked complete or saved as complete exchanges. Provider calls have deadlines and reject redirects. Provider response bodies and diagnostics cannot become public error messages. Model request bodies are bounded before JSON parsing. Configured authentication is enforced for workspace Copilot whether the model is cloud or workspace reasoning. Thread creation verifies a linked incident in the current workspace. The model and existing configured provider were preserved; no paid model call was made during tests.

OpenAI streaming behavior was checked against the official guide: https://developers.openai.com/api/docs/guides/streaming-responses . Tests use mocked providers, including split UTF-8 frames, DONE without a trailing newline, cancellation, provider errors and incomplete streams.

### Remaining access/configuration blockers

The Supabase CLI in this session has no access token. The current CLI could not prompt here; the compatible interactive CLI reached its short verification-code prompt, but that step was not completed. A browser fallback was signed out and the tab became unavailable. No migration was applied and no migration history was altered. Approval exists, but approval does not provide a database login.

Railway configuration checks confirmed that the HQ URL matches the linked Supabase project, but `SUPABASE_SERVICE_ROLE_KEY` is absent, rather than sealed. It is also absent from the checked related AI and Platform services. The key is needed only on the HQ server for trusted audit delivery, member lookup and stored availability history. It was not invented, copied from an unrelated project or exposed in frontend code. Those functions and persistent recording remain unactivated until authorized server credentials and the migration step are available. No GitHub push was performed.


### Final deployed source snapshot

Deployment `a11e6c0d-15b2-48a3-b635-ce8f0dadfa2a` reached SUCCESS on Railway production. It includes the live status page and Copilot stream hardening. All 113 local release-check groups, TypeScript and changed-file lint passed; the production build reran its release checks and health check successfully. The production dependency audit reported zero known vulnerabilities. The live browser rendered the status page with “Live service updates” and all four core services operational. Source remains in the HQ folder; GitHub was not pushed. Both Supabase migrations and the absent server service key remain unresolved access/configuration requirements, so this is not a claim that every authenticated workflow or enterprise requirement is complete.
