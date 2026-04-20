# Shynvo platform completion plan

This document is the **source of truth** for what “done” means beyond marketing and auth shells. Supabase **Auth** is assumed; this plan covers **data**, **billing**, **product verticals**, and **hardening**.

**Product narrative & long horizon:** see **[`VISION_AND_ROADMAP.md`](./VISION_AND_ROADMAP.md)** (power roadmap + 2050-grade direction; review quarterly). In the console: **`/vision`**.

Apply database changes from `supabase/migrations/` in the Supabase SQL Editor (or your usual migration pipeline).

---

## Done in repo (spine)

- [x] **SQL migration** `supabase/migrations/20260418120000_platform_spine.sql` — `profiles`, `subscriptions`, `webhook_event_deliveries`, profile auto-create trigger, RLS.
- [x] **Lemon webhook** — signature verify, **SHA-256 idempotent** deliveries, subscription upsert when `meta.custom_data.shynvo_user_id` (or legacy `supabase_user_id`) is present.
- [x] **Service role client** — `lib/supabase/admin.ts` (server-only; never expose key).
- [x] **Plan helper** — `lib/billing/plan.ts` — `free` vs `paid` from subscription `status`.
- [x] **Checkout URL helpers** — `getCheckoutUrlForUser` / `appendCheckoutCustomData` in `lib/billing.ts`.
- [x] **Marketing CTAs (signed-in)** — homepage `Header` / `Hero` / `ConnectCTA` use `getSignedInCheckoutUrl()` so trial links include `shynvo_user_id` when auth + `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` are set; anonymous visitors keep generic checkout or `#trial`.
- [x] **Lemon customer portal link** — optional `NEXT_PUBLIC_LEMONSQUEEZY_CUSTOMER_PORTAL_URL` / `LEMONSQUEEZY_CUSTOMER_PORTAL_URL`; **Billing** shows **Customer portal** when plan reads as paid.
- [x] **Settings → Billing** — `/settings/billing` shows plan, subscription snapshot, **Open checkout** (with `shynvo_user_id`), and migration hints if the DB is not ready.
- [x] **Console nav** — **clickable module boxes** (`CONSOLE_MODULES` + `/hub` home); **Settings** hub, **Billing**, **API keys**, and **Connectors** included.
- [x] **Copilot without upstream** — `POST /api/copilot/chat` uses **OpenAI** when `OPENAI_API_KEY` is set, else **offline** replies; default chat path no longer requires `SHYNVO_REASONING_API_URL`.
- [x] **API keys without Supabase** — **session-scoped keys** in server memory (per `shynvo_dev_tid` cookie) + proxy validation for `/api/reasoning` and `/api/robot` when auth env is off; Postgres-backed keys when auth is on.
- [x] **Runbooks** — `/runbooks` catalog + detail pages (in-repo procedures; export to Git/docs later).
- [x] **Automations** — playbooks + **dry-run** API (`/api/automations/dry-run`) with optional robot health check; run history in session memory or Supabase (`automation_dry_runs`) when signed in.
- [x] **Proxy auth gate** — `/api/reasoning` and `/api/robot` require a **session or `shynvo_sk_` API key** when auth env vars are set; keys stored hashed in `api_keys` (`20260418150000_api_keys.sql`).
- [x] **Security headers** — global headers in `next.config.ts`.
- [x] **Incidents migration + data layer** — SQL file + `lib/incidents/*`: **database** rows when Supabase + table are used; **session-scoped** incidents (same cookie) when auth env is off—only user-created rows, no seeded data.
- [x] **Services + alert ingest** — migration `20260419120000_services_alert_ingest.sql`: `services`, `alert_ingest_tokens`, incident columns `service_id`, `postmortem`, `external_ref`; **`/services`** (catalog + paid ingest UI); **`POST /api/integrations/alerts`** (Bearer ingest token); token mint **`/api/user/alert-ingest-tokens`** (paid plan); incidents list/detail wired to service + postmortem.

---

## Phase A — Wire billing in the product (high priority)

- [x] **Marketing / other CTAs**: signed-in homepage uses **`getCheckoutUrlForUser`** via `lib/marketing/checkout-context.ts`; no session → generic `getTrialHref()`.
- [ ] **Railway / env**: set `SUPABASE_SERVICE_ROLE_KEY` for webhook persistence; keep it off the client.
- [ ] **Apply migration** in Supabase and confirm a test webhook creates/updates `subscriptions`.
- [ ] **Settings → Billing** page: current plan (read `subscriptions` with user session), link to Lemon customer portal if you use it.
- [x] **Gate features** — **Automations** + **Services** (catalog + alert ingest tokens) require **paid** subscription when billing reads cleanly from `subscriptions` (same pattern as automations: free users see upgrade CTA).

---

## Phase B — Security & scale

- [x] **Protect `/api/reasoning` and `/api/robot`**: when Supabase auth env is set, **`getUser()`** or a valid **API key** must succeed or the proxy returns **401**. If auth env is omitted, proxies stay open for local development.
- [x] **Rate limits** — in-memory limits on reasoning/robot proxies (per user+IP when auth on, per IP when off) and on the Lemon webhook route (per IP).
- [x] **Baseline security headers** in `next.config.ts` (frame deny, nosniff, referrer policy, permissions-policy). Add **CSP** when you introduce third-party scripts.

---

## Phase C — First real product vertical (pick one)

### Option 1 — Incident Copilot

- [x] **SQL** — `copilot_threads` / `copilot_messages` in `20260418140000_console_extensions.sql` (apply with spine migration).
- [x] **UI** — `CopilotChat` posts to `/api/copilot/chat` (or override); **thread sidebar + persist** to `copilot_threads` / `copilot_messages` when signed in and migration applied (`/api/copilot/threads`, `/api/copilot/threads/[id]/messages`).
- [x] **Copilot streaming** — SSE from `/api/copilot/chat` when `stream: true` (built-in route).

### Option 2 — Incidents

- [x] **Migration** `supabase/migrations/20260418130000_incidents.sql` — `incidents` table + RLS (apply when Supabase is ready).
- [x] **Data layer** — `lib/incidents/data.ts` loads from DB when authenticated and the table responds; **session** path lists only user-created incidents for the browser session when auth env is off; banner explains migration/sign-in.
- [x] **Create** — `/incidents/new` + server action (Supabase insert or session store); edit / ingest (PagerDuty, etc.) still optional.
- [x] **Incident timeline** — session incidents append events on open + status change (`timeline-dev`); database incidents list `audit_log` rows for `incident.status_updated` matching the incident id.

---

## Phase D — Approvals, automations, audit

- [x] **Approvals** — `approval_requests` in `20260418140000_console_extensions.sql`; **`/approvals`** includes **New approval request** (console form) + Approve/Deny; Postgres when signed in, or **session dev-store** when auth env is off; **`approval.requested`** audit event on DB create; **Recent** list.
- [x] **Automations (baseline)** — playbook list + dry-runs + recent run panel; durable run history in DB when migration `20260418160000_automation_dry_runs.sql` is applied.
- [x] **Audit log** — `audit_log` table + RLS in `20260418140000_console_extensions.sql`; **`appendAuditEvent`** writes **subscription sync** (Lemon webhook), **API key** create/revoke, **incident.status_updated**, **automation.dry_run**; **`/audit`** lists rows from the DB for the signed-in user (empty until events exist).

---

## Phase F — IT ops expansion (roadmap)

**Shipped in repo**

- [x] **Service catalog** — name, environment, owner hint, description; link incidents via `service_id`.
- [x] **Alert → incident** — monitoring stacks POST JSON to `/api/integrations/alerts` with `Authorization: Bearer <shynvo_ingest_…>`; optional `dedupe_key` for idempotency; optional `service_id` / `service_name`; `summary` stored as initial **postmortem** text.
- [x] **Postmortem field** — long-form notes on incident detail (database incidents).

**Next builds (engineering backlog)** — expanded and maintained in **[`VISION_AND_ROADMAP.md`](./VISION_AND_ROADMAP.md)** (tracks + horizon). Short list: change calendar, on-call, service graph, SLOs, ITSM sync, status page, structured alert adapters.

---

## Phase E — Polish & operations

- [ ] Transactional email (e.g. Resend) for billing and security notices.
- [ ] Error tracking (e.g. Sentry) on Next + structured logs for webhooks.
- [ ] E2E tests (Playwright): sign-in → checkout metadata → webhook path (staging).
- [ ] Replace draft legal pages with counsel-reviewed copy before broad launch.

---

## Phase G — Equipment operations (implementation blueprint)

This section turns the equipment roadmap into concrete build steps and data models. Ship in this order to maximize operator value and minimize rework.

### G1. Certificate and secrets inventory (first)

**Why first:** biggest outage-prevention ROI and straightforward to model.

**Build order**

1. Create inventory tables + basic CRUD UI (`/assets/certificates`, `/assets/secrets`).
2. Add expiry dashboards (30/14/7-day windows).
3. Add incident linking + audit events for create/update/rotate/revoke.
4. Add optional alerting hooks (email/Slack/webhook) for imminent expiry.

**Tables**

- `asset_certificates`
  - `id` (uuid, pk), `user_id` (uuid), `name` (text), `environment` (text)
  - `cn` (text), `sans` (text[]), `issuer` (text)
  - `expires_at` (timestamptz), `auto_renew` (bool)
  - `owner_hint` (text), `service_id` (uuid, nullable), `incident_id` (uuid, nullable)
  - `notes` (text), `created_at`, `updated_at`
- `asset_secrets`
  - `id` (uuid, pk), `user_id` (uuid), `name` (text), `environment` (text)
  - `secret_type` (text: `api_key` | `token` | `password` | `cert_key`)
  - `rotation_policy_days` (int), `last_rotated_at` (timestamptz), `next_rotate_at` (timestamptz)
  - `owner_hint` (text), `service_id` (uuid, nullable), `incident_id` (uuid, nullable)
  - `notes` (text), `created_at`, `updated_at`

### G2. Backup and restore readiness tracking

**Why second:** DR confidence and compliance proof.

**Build order**

1. Add backup policy + run tracking UI (`/resilience/backups`).
2. Track last successful backup + restore test outcome.
3. Add incident/runbook linkage and audit trails.
4. Add “at risk” score badges (stale backup, no restore test, repeated failures).

**Tables**

- `backup_policies`
  - `id` (uuid, pk), `user_id` (uuid), `name` (text)
  - `asset_scope` (text), `rpo_target_minutes` (int), `rto_target_minutes` (int)
  - `retention_days` (int), `enabled` (bool), `owner_hint` (text)
  - `created_at`, `updated_at`
- `backup_runs`
  - `id` (uuid, pk), `user_id` (uuid), `policy_id` (uuid, fk)
  - `status` (text: `success` | `failed` | `partial`)
  - `started_at` (timestamptz), `finished_at` (timestamptz)
  - `snapshot_ref` (text), `error_summary` (text)
  - `incident_id` (uuid, nullable), `created_at`
- `restore_tests`
  - `id` (uuid, pk), `user_id` (uuid), `policy_id` (uuid, fk)
  - `status` (text: `passed` | `failed`)
  - `tested_at` (timestamptz), `duration_seconds` (int), `notes` (text)
  - `incident_id` (uuid, nullable), `created_at`

### G3. Network firmware and config drift tracking

**Why third:** catches silent network risk before major incidents.

**Build order**

1. Add network asset registry (`/assets/network`).
2. Record baseline firmware/config hashes.
3. Compute drift status per device and expose “needs review” queue.
4. Add approval-gated remediation actions and audit emission.

**Tables**

- `network_devices`
  - `id` (uuid, pk), `user_id` (uuid)
  - `hostname` (text), `device_role` (text), `vendor` (text), `model` (text)
  - `serial_number` (text), `mgmt_ip` (text), `site` (text), `environment` (text)
  - `firmware_version` (text), `owner_hint` (text), `created_at`, `updated_at`
- `network_config_snapshots`
  - `id` (uuid, pk), `user_id` (uuid), `device_id` (uuid, fk)
  - `captured_at` (timestamptz), `config_hash` (text), `snapshot_ref` (text)
  - `captured_by` (text), `created_at`
- `network_drift_findings`
  - `id` (uuid, pk), `user_id` (uuid), `device_id` (uuid, fk)
  - `finding_type` (text: `firmware` | `config`)
  - `severity` (text), `summary` (text), `detected_at` (timestamptz)
  - `status` (text: `open` | `approved` | `resolved`)
  - `approval_request_id` (uuid, nullable), `incident_id` (uuid, nullable)
  - `created_at`, `updated_at`

### G4. MFA and privileged access posture

**Why fourth:** security posture gating for high-impact operations.

**Build order**

1. Add posture dashboard (`/governance/access`).
2. Track MFA coverage and privileged account hygiene.
3. Gate selected automations on posture checks (with approval override).
4. Add policy reasons to audit entries for blocked/overridden actions.

**Tables**

- `access_posture_snapshots`
  - `id` (uuid, pk), `user_id` (uuid)
  - `captured_at` (timestamptz)
  - `mfa_coverage_percent` (numeric), `privileged_accounts_total` (int)
  - `privileged_accounts_mfa_enabled` (int), `stale_privileged_accounts` (int)
  - `source_system` (text), `created_at`
- `access_policy_rules`
  - `id` (uuid, pk), `user_id` (uuid)
  - `rule_name` (text), `min_mfa_coverage_percent` (numeric)
  - `block_high_risk_without_approval` (bool), `enabled` (bool)
  - `created_at`, `updated_at`

### G5. Maintenance windows and change calendar

**Why fifth:** turns approvals + automations into safe change management.

**Build order**

1. Add change calendar UI (`/changes`) with upcoming windows.
2. Attach automation actions to a window (or require explicit override approval).
3. Link window events to incidents and audit.
4. Add conflict detection (overlapping windows on same service).

**Tables**

- `change_windows`
  - `id` (uuid, pk), `user_id` (uuid)
  - `title` (text), `service_id` (uuid, nullable), `environment` (text)
  - `starts_at` (timestamptz), `ends_at` (timestamptz)
  - `risk_level` (text), `requires_approval` (bool)
  - `owner_hint` (text), `notes` (text)
  - `created_at`, `updated_at`
- `change_actions`
  - `id` (uuid, pk), `user_id` (uuid), `change_window_id` (uuid, fk)
  - `action_type` (text), `target_ref` (text)
  - `status` (text: `planned` | `executed` | `rolled_back` | `cancelled`)
  - `approval_request_id` (uuid, nullable), `incident_id` (uuid, nullable)
  - `executed_at` (timestamptz, nullable), `created_at`, `updated_at`

### Cross-cutting integration rules

- Every equipment table should include `user_id` + RLS ownership patterns consistent with existing console tables.
- High-risk actions should always connect to `approval_requests` and append to `audit_log`.
- Incident pages should support linking affected equipment records.
- Runbooks should optionally reference equipment types and model-specific procedures.
- Export paths should include equipment context for post-incident reporting.

### Suggested route map (UI)

- `/assets/certificates`
- `/assets/secrets`
- `/resilience/backups`
- `/assets/network`
- `/governance/access`
- `/changes`

---

## Reference

| Topic | Location |
|--------|-----------|
| Vision & roadmap (doc) | [`docs/VISION_AND_ROADMAP.md`](./VISION_AND_ROADMAP.md) · UI: **`/vision`** |
| Alert → incident | `POST /api/integrations/alerts` (Bearer ingest token; requires `SUPABASE_SERVICE_ROLE_KEY`) |
| Webhook URL | `POST /api/webhooks/lemonsqueezy` |
| Subscription sync | `lib/billing/sync-lemon-subscription.ts` |
| Idempotency | `lib/billing/webhook-delivery.ts` |
| Lemon payload helpers | `lib/lemonsqueezy/parse-webhook.ts` |
| Deploy / env | `README.md` |

---

## Quality bar

- **Idempotent webhooks** — safe under Lemon retries.
- **No service role in the browser** — only server routes.
- **RLS** on user-owned tables; subscriptions **read** for owner, **writes** via service role webhook only.
- **Explicit checkout custom data** — without `shynvo_user_id`, subscription webhooks return **422** and release the delivery idempotency slot so Lemon can retry after you fix checkout.
