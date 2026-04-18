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
- [x] **Settings → Billing** — `/settings/billing` shows plan, subscription snapshot, **Open checkout** (with `shynvo_user_id`), and migration hints if the DB is not ready.
- [x] **Console nav** — **clickable module boxes** (`CONSOLE_MODULES` + `/hub` home); **Settings** hub, **Billing**, **API keys**, and **Connectors** included.
- [x] **Copilot without upstream** — `POST /api/copilot/chat` uses **OpenAI** when `OPENAI_API_KEY` is set, else **offline** replies; default chat path no longer requires `SHYNVO_REASONING_API_URL`.
- [x] **API keys without Supabase** — in-memory **demo keys** (per `shynvo_dev_tid` cookie) + proxy validation for `/api/reasoning` and `/api/robot` when auth env is off.
- [x] **Runbooks** — `/runbooks` catalog + detail pages (in-repo procedures; export to Git/docs later).
- [x] **Automations** — playbooks + **dry-run** API (`/api/automations/dry-run`) with optional robot health check; run history in dev memory per session/user.
- [x] **Proxy auth gate** — `/api/reasoning` and `/api/robot` require a **session or `shynvo_sk_` API key** when auth env vars are set; keys stored hashed in `api_keys` (`20260418150000_api_keys.sql`).
- [x] **Security headers** — global headers in `next.config.ts`.
- [x] **Incidents migration + data layer** — SQL file + `lib/incidents/*` with DB-or-demo list/detail (no Supabase required to run the app).

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
- [x] **UI** — client `CopilotChat` posts to `/api/reasoning/v1/chat` (or `NEXT_PUBLIC_COPILOT_PROXY_PATH`); streaming/persist threads still optional.

### Option 2 — Incidents

- [x] **Migration** `supabase/migrations/20260418130000_incidents.sql` — `incidents` table + RLS (apply when Supabase is ready).
- [x] **Data layer** — `lib/incidents/data.ts` loads from DB when the table exists; otherwise **demo** rows + banner on the list page.
- [x] **Create** — `/incidents/new` + server action when Supabase + table exist; edit / ingest (PagerDuty, etc.) still optional.

---

## Phase D — Approvals, automations, audit

- [x] **Approvals** — `approval_requests` in `20260418140000_console_extensions.sql`; **`/approvals`** Approve/Deny (Supabase or **demo dev-store**); **Recent** list.
- [x] **Automations (baseline)** — playbook list + dry-runs + recent run panel; extend with real definitions + durable run history in DB.
- [x] **Audit log** — `audit_log` table + RLS in `20260418140000_console_extensions.sql`; **`appendAuditEvent`** writes **subscription sync** (Lemon webhook) and **API key** create/revoke; **`/audit`** lists rows from the DB when available.

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
