# Backend and frontend repair — 7 October 2026

## Folder to commit and deploy

Use **`C:\Users\sandr\OneDrive\Desktop\SMOHIX\SMOHIX`** on branch `smohix-evolution`.
This is the active Next.js platform repository, with frontend pages/components, the platform backend in `app/api`, server-side helpers in `lib`, database migrations in `supabase/migrations`, and Railway configuration at its root.

The neighbouring folders are not interchangeable deployments:

| Folder under `C:\Users\sandr\OneDrive\Desktop\SMOHIX` | Finding |
| --- | --- |
| `SMOHIX` | Active fullstack platform checkout; all changes in this repair are here. |
| `web` | Separate older Git checkout. Do not commit this repair there. |
| `backend` | Incomplete Java payment scaffolding. No runnable build/application or real payment provider implementation; not the robot execution backend. |
| `frontend`, `admin` | Partial Vue payment screens; no standalone deployable platform build found. |

Do not run Git commands from the parent directory: it can resolve to an unrelated repository above these folders.

## Repairs

- Signed-in execution contacts the robot service using the existing `/v1/remediate` contract. Missing configuration, unsuccessful responses, asynchronous acceptance, malformed confirmations and unfinished steps cannot report success.
- Local preview execution remains explicitly simulated. Infrastructure actions are never automatically retried when the outcome is uncertain.
- Execution requires a durable audit intent before dispatch. High-risk playbooks require a recent approval for the exact playbook from a different person. The approval ID claims a unique audit record, preventing reuse across both execution endpoints.
- Workspace role and subscription checks also cover the incident remediation server action. Membership lookup failures no longer fall back to a personal context with no role.
- Removed fabricated hidden approval text from incident remediation; users provide approval context and rollback instructions visibly.
- Execution no longer manufactures a successful dry-run record. Connector health checks are labelled as connectivity checks, not proof that a playbook is safe.
- Critical workspace data query failures show a retryable error view instead of an empty list. Service dependency and budget lookup failures cannot silently become healthy results. Audit export failures return a safe unavailable response rather than an empty export.
- Existing SLO settings survive opening a service view. Current budget indicators are incident-derived estimates, not measured request availability.
- Added `20261007180000_org_slo_upsert_index.sql`: the old partial organization index could not support PostgREST SLO upserts. The replacement preserves row uniqueness and does not delete records. See [PostgreSQL conflict index inference](https://www.postgresql.org/docs/16/sql-insert.html).
- Accepted policy lookup now selects the playbook ID required to aggregate its guardrails. Lookup failures block execution rather than silently discarding accepted policies.
- Audit delivery uses bounded retries with the same row ID. Confirmed actions with incomplete saved history report that limitation and caution against rerunning.
- Live execution no longer invents recovery duration, side-effect measurements or decision accuracy, or promotes policies from those invented measurements. Existing model-generated outcome records are labelled as unmeasured estimates.
- Railway JSON and TOML now agree on Railpack, the start/build commands, `/api/health`, and restart settings. See the [Railway configuration reference](https://docs.railway.com/config-as-code/reference).
- Public roadmap wording distinguishes implemented service views from planned capabilities.

## Verification and remaining requirements

Release checks include behaviour tests for confirmed/unconfirmed execution, no automatic action retries, stale/self/mismatched approvals, bounded audit delivery, and preservation of configured SLO targets. TypeScript, lint and production build are checked separately. These checks do not certify live infrastructure actions or external providers.

All 108 release checks and the production build passed. TypeScript passed; changed-file lint has no errors and one existing unused `_orgId` parameter warning in the incident reader. The migration bundle includes all 56 migration files. Database migration execution and authenticated production workflows still require staging verification.

The actual robot backend source was not found. Its deployment must enforce authentication, tenant isolation, idempotency and guarded execution itself; frontend checks cannot substitute for those protections. Confirm that its completed response follows the existing `{ ok: true, steps?: [...] }` contract. A connectivity check alone does not validate a playbook.

Before deployment, apply the pending migration `supabase/migrations/20261007180000_org_slo_upsert_index.sql` to the correct database using your normal migration workflow (test in staging first). If other migrations are already pending, review them before any blanket database push. The Railway upload does not apply this database migration. No migration was executed and no production data was changed by Codex.

Before enabling paid live execution, verify workspace membership, subscription records, server-side service role configuration, audit writes, and the robot backend using a staging target.

The separate Java payment scaffolding still needs a runnable application, persistent storage, authenticated ownership enforcement and real provider verification before it can become a production payment service. It is not part of this Railway platform deployment.

Supabase remains the current identity/database provider. Replacing it with an owned identity platform requires a separate migration plan and must preserve existing accounts, sessions and row-level authorization.

## Manual commit and deployment

### HQ privacy follow-up

The public HQ and service status view now use customer-facing availability text. Raw health JSON, process uptime, backend service names and probe paths are no longer displayed or returned in the public status payload. The health endpoint retains its minimal `{ "ok": true }` response for monitoring.

The HQ assistant no longer receives the backend operation catalog or framework/database implementation descriptions. API questions lead to documentation. Product orientation receives an explicit public projection instead of importing the full product registry into browser code. Repository and backend dependency fields stay in server-side registry use.

Monitoring animation, real availability counts, refresh behaviour and the local/UTC time display remain active. Status failures show a controlled public message rather than raw exception text. Privacy checks cover the public health response and reject diagnostic fields from upstream responses.

No commit, push or deployment was performed by Codex.

```powershell
cd "C:\Users\sandr\OneDrive\Desktop\SMOHIX\SMOHIX"
git status
git diff --check
git add .
git commit -m "Fix automation execution integrity and workspace data reliability"
git push origin smohix-evolution
```

After a successful push, verify the selected Railway project/service, then upload manually:

```powershell
railway status
railway up --detach
```

`--detach` returns after upload; check the Railway deployment result before treating the platform as updated.
