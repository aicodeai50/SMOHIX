# Shynvo platform completion plan

This document is the **source of truth** for what “done” means beyond marketing and auth shells. Supabase **Auth** is assumed; this plan covers **data**, **billing**, **product verticals**, and **hardening**.

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

---

## Phase A — Wire billing in the product (high priority)

- [x] **Marketing / other CTAs**: signed-in homepage uses **`getCheckoutUrlForUser`** via `lib/marketing/checkout-context.ts`; no session → generic `getTrialHref()`.
- [ ] **Railway / env**: set `SUPABASE_SERVICE_ROLE_KEY` for webhook persistence; keep it off the client.
- [ ] **Apply migration** in Supabase and confirm a test webhook creates/updates `subscriptions`.
- [ ] **Settings → Billing** page: current plan (read `subscriptions` with user session), link to Lemon customer portal if you use it.
- [ ] **Gate features (optional)** — re-introduce paid-only routes in middleware when you ship execution beyond dry-run.

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

## Phase E — Polish & operations

- [ ] Transactional email (e.g. Resend) for billing and security notices.
- [ ] Error tracking (e.g. Sentry) on Next + structured logs for webhooks.
- [ ] E2E tests (Playwright): sign-in → checkout metadata → webhook path (staging).
- [ ] Replace draft legal pages with counsel-reviewed copy before broad launch.

---

## Reference

| Topic | Location |
|--------|-----------|
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
