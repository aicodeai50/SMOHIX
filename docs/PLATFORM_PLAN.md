# Shynvo platform completion plan

This document is the **source of truth** for what “done” means beyond marketing and auth shells. Supabase **Auth** is assumed; this plan covers **data**, **billing**, **product verticals**, and **hardening**.

Apply database changes from `supabase/migrations/` in the Supabase SQL Editor (or your usual migration pipeline).

---

## Done in repo (spine)

- [x] **SQL migration** `supabase/migrations/20260418120000_platform_spine.sql` — `profiles`, `subscriptions`, `webhook_event_deliveries`, profile auto-create trigger, RLS.
- [x] **Lemon webhook** — signature verify, **SHA-256 idempotent** deliveries, subscription upsert when `meta.custom_data.shynvo_user_id` (or legacy `supabase_user_id`) is present.
- [x] **Service role client** — `lib/supabase/admin.ts` (server-only; never expose key).
- [x] **Plan helper** — `lib/billing/plan.ts` — `free` vs `paid` from subscription `status`.
- [x] **Checkout URL helpers** — `getCheckoutUrlForUser` / `appendCheckoutCustomData` in `lib/billing.ts` (wire them from billing UI / CTAs next).
- [x] **Settings → Billing** — `/settings/billing` shows plan, subscription snapshot, **Open checkout** (with `shynvo_user_id`), and migration hints if the DB is not ready.
- [x] **Console nav** — **Billing** link in the sidebar next to Connectors.
- [x] **Automations hint** — signed-in **free** users see an upgrade strip linking to Billing.
- [x] **Proxy auth gate** — `/api/reasoning` and `/api/robot` require a Supabase session when auth env vars are set.
- [x] **Security headers** — global headers in `next.config.ts`.
- [x] **Incidents migration + data layer** — SQL file + `lib/incidents/*` with DB-or-demo list/detail (no Supabase required to run the app).

---

## Phase A — Wire billing in the product (high priority)

- [ ] **Marketing / other CTAs**: use **`getCheckoutUrlForUser`** only when you know the visitor is signed in; keep generic Lemon links on the public homepage where there is no session.
- [ ] **Railway / env**: set `SUPABASE_SERVICE_ROLE_KEY` for webhook persistence; keep it off the client.
- [ ] **Apply migration** in Supabase and confirm a test webhook creates/updates `subscriptions`.
- [ ] **Settings → Billing** page: current plan (read `subscriptions` with user session), link to Lemon customer portal if you use it.
- [ ] **Gate features**: use `getBillingPlanForUser` in middleware or layouts (e.g. paid-only routes under `/automations`).

---

## Phase B — Security & scale

- [x] **Protect `/api/reasoning` and `/api/robot`**: when Supabase auth env is set, **`getUser()`** must succeed or the proxy returns **401** (no anonymous relay). If auth env is omitted, proxies stay open for local development.
- [ ] **Rate limits** on proxies and webhooks (per user / IP).
- [x] **Baseline security headers** in `next.config.ts` (frame deny, nosniff, referrer policy, permissions-policy). Add **CSP** when you introduce third-party scripts.

---

## Phase C — First real product vertical (pick one)

### Option 1 — Incident Copilot

- [ ] `copilot_threads` / `copilot_messages` tables (RLS by `user_id`).
- [ ] UI: replace placeholder with streaming chat calling `/api/reasoning/...` server-side.
- [ ] Persist threads; optional export.

### Option 2 — Incidents

- [x] **Migration** `supabase/migrations/20260418130000_incidents.sql` — `incidents` table + RLS (apply when Supabase is ready).
- [x] **Data layer** — `lib/incidents/data.ts` loads from DB when the table exists; otherwise **demo** rows + banner on the list page.
- [ ] **CRUD / ingest**: create & edit UI, optional PagerDuty / Opsgenie / inbound webhooks.

---

## Phase D — Approvals, automations, audit

- [ ] **Approvals** queue table + UI bound to data (not static cards).
- [ ] **Automations**: definitions + run history, or delegate to your automation service with entitlement checks.
- [ ] **Audit log**: append-only `audit_log` for sensitive actions (webhook applied, proxy call policy change, etc.).

---

## Phase E — Polish & operations

- [ ] Transactional email (e.g. Resend) for billing and security notices.
- [ ] Error tracking (e.g. Sentry) on Next + structured logs for webhooks.
- [ ] E2E tests (Playwright): sign-in → checkout metadata → webhook path (staging).
- [ ] Replace legal placeholders with counsel-reviewed copy before broad launch.

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
