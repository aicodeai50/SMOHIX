# Zentro compatibility allowlist

Files listed here **must** retain `zentro` / `Zentro` references for backward compatibility (env fallbacks, cookie migration, legacy API prefixes, redirects, Postgres RPC names, or compat regression tests). They are excluded from the zero-Zentro customer-facing scan in `scripts/test-zero-zentro.ts`.

Do **not** add customer-visible UI, docs, or integration examples to this list — fix those to use Smohix branding instead.

## API key & integration headers (server-side legacy acceptance)

- `lib/api-keys/token.ts` — `LEGACY_*` prefixes (`zentro_sk_`, `zentro_ca_`, `zentro_ingest_`)
- `lib/integrations/smohix-headers.ts` — `LEGACY_ZENTRO_HEADERS`, `readSmohixHeader()` fallback
- `lib/integrations/alert-webhook-verify.ts` — comment documenting legacy header acceptance
- `lib/api-keys/resolve.ts` — reads legacy `x-zentro-api-key` via token constants

## Environment & backend URL fallbacks

- `lib/backend-urls.ts` — `ZENTRO_*` / `REACT_APP_ZENTRO_*` env aliases
- `lib/site.ts` — remaps stale `zentro.run` / `www.zentro.run` SEO hosts
- `lib/product-registry.ts` — `ZENTRO_AI_PUBLIC_URL` env fallback
- `lib/developer-journey.ts` — `ZENTRO_API_KEY` env fallback in server example block
- `lib/billing/own-api.ts` — legacy Own API env names (if present)
- `lib/platform/admin.ts` — `ZENTRO_PLATFORM_ADMIN_EMAILS` fallback
- `lib/notifications/email.ts` — legacy email env fallbacks
- `lib/integrations/slack.ts` — legacy Slack env fallbacks
- `lib/contact/*.ts` — legacy contact/lead env fallbacks
- `lib/revops/*.ts` — legacy RevOps env fallbacks
- `lib/observability/logger.ts` — legacy service name env

## Cookie, storage & proxy migration

- `lib/dev-tenant.ts` — `LEGACY_DEV_TENANT_COOKIE` (`zentro_dev_tid`)
- `lib/storage-migrate.ts` — browser storage key migration from Zentro prefixes
- `lib/analytics.ts` — `LEGACY_ANALYTICS_CONSENT_KEY` (`zentro_analytics_consent`)
- `proxy.ts` — legacy cookie read/migrate, `ZENTRO_SKIP_CANONICAL_HOST_REDIRECT`
- `components/app/ConsoleNavPanel.tsx` — legacy hub/console localStorage keys
- `components/console/HubQuickLinksPanel.tsx` — legacy hub personalization key
- `components/consent/AnalyticsConsentBanner.tsx` — reads legacy consent key
- `lib/console/load-ambient-status.ts` — legacy dev tenant cookie fallback

## Next.js redirects & host cutover

- `next.config.ts` — `zentro.run` host redirects, `/products/zentro-*` path redirects

## API routes — env fallbacks & internal compat (not customer-facing messages)

- `app/api/integrations/alerts/route.ts` — `ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET` env fallback
- `app/api/integrations/vulnerabilities/route.ts` — same signing-secret env fallback
- `app/api/health/db/route.ts` — calls Postgres `zentro_db_health()` RPC
- `app/api/user/api-keys/route.ts` — legacy dev tenant cookie
- `app/api/user/api-keys/[id]/route.ts` — legacy dev tenant cookie
- `app/api/automations/dry-run/route.ts` — legacy dev tenant cookie
- `app/api/automations/execute/route.ts` — legacy dev tenant cookie
- `app/api/integrations/slack/approvals/route.ts` — legacy Slack env (if present)
- `app/api/governance/compliance/**/route.ts` — cron `ZENTRO_*_CRON_SECRET` env fallbacks where duplicated
- `app/(app)/**/actions.ts` — legacy env fallbacks in server actions (compliance digests, bundles, etc.)
- `app/(app)/settings/connectors/page.tsx` — `ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET` env fallback only
- `app/(app)/governance/compliance/assessor-api/page.tsx` — `ZENTRO_SITE_URL` env fallback only
- `app/(app)/settings/api-keys/page.tsx` — legacy dev tenant cookie
- `app/(app)/overview/page.tsx` — legacy dev tenant cookie
- `app/(app)/incidents/**` — legacy dev tenant cookie
- `app/(app)/hub/actions.ts` — legacy dev tenant cookie
- `app/(app)/automations/page.tsx` — legacy dev tenant cookie
- `app/(app)/approvals/**` — legacy dev tenant cookie

## Database types & migrations (Postgres identifiers)

- `lib/supabase/database.types.ts` — `zentro_db_health` RPC name from Supabase schema
- `README.md` — migration changelog references to `zentro_db_health()` SQL function name only

## Scripts — compat regression (not customer output)

- `scripts/gen-alert-signature.mjs` — `ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET` env fallback; comment only for legacy headers
- `scripts/test-smohix-rebrand.ts` — tests legacy env/redirect behavior
- `scripts/test-copilot-reasoning.ts` — `ZENTRO_REASONING_API_URL` fallback test
- `scripts/test-contact-leads.ts` — clears legacy platform admin env
- `scripts/test-revops-pipeline.ts` — clears legacy platform admin env
- `scripts/security-regression.mjs` — SEO host remap assertions

## Internal planning docs (not shipped UI)

- `docs/PLATFORM_PLAN.md` — historical plan references
