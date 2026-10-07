# Smohix maintenance audit — 7 October 2026

## Changes prepared locally

- Password-reset session checks now finish for valid, invalid, failed, and stalled checks. Provider failures are translated into safe account messages.
- Production cannot fall back to anonymous development tenants for console/API operations when identity configuration is absent. Public marketing, contact, health and product status remain available.
- Assets, changes and resilience now join the protected console route list.
- API responses and action redirects across operations, governance, keys, integrations and billing callbacks no longer return raw database errors.
- Database readiness no longer publishes Postgres versions or database diagnostics.
- Upstream proxy failures and redirects return a safe error, and authenticated proxy responses use no-store caching.
- Notification preferences accept only known boolean fields, and failures are visible instead of silently disappearing.

## Separate Java backend

Location: ../backend (outside the Git checkout that deploys the Next.js application).

The payment source is an incomplete scaffold, not a deployable service: no Maven/Gradle build, application entry point, shared Result implementation, or complete provider integration is present. Java/Maven are unavailable in this environment, so these edits have not been compiled.

Hardening applied directly in that folder:

- Payment controller disabled unless smohix.payment.enabled=true; keep it disabled.
- Replaced hard-coded customer 1 with an explicit verified PaymentPrincipal contract.
- Status, list and refund queries scope by the verified customer's ID; list sizes bounded.
- Populated missing payment fields and rejected nonpositive refund amounts.
- Removed signature-verification bypasses, fake payment results, and refunds that logged success without sending a refund. Unimplemented operations fail closed.
- Disabled XML external entities, DTDs and schemas; bounded callback size.

Before enabling: add a real build/application, trusted identity adapter, server-side order pricing/ownership validation, provider SDKs, signed amount/currency/merchant checks, idempotency/concurrency controls, and payment/refund integration tests. These files require separate version control; committing the web checkout alone does not include them. Existing Next.js PayPal/Lemon Squeezy billing routes were not replaced by this scaffold.

## Can Smohix own its identity/data infrastructure?

Yes. Recommended migration: self-host the open-source Supabase stack under Smohix infrastructure first. This preserves the current database/RLS and authentication interfaces while removing dependence on hosted Supabase operations. It is still built on Supabase software; it is not a new independent implementation.

Reference: https://supabase.com/docs/guides/self-hosting

Use a staging deployment with TLS, private database/administration ports, secret management, tested backups and restoration, monitoring and updates. Validate account IDs, password hashes, sessions, email delivery, redirects/OAuth, organization permissions and rollback before changing production URLs. Keep the working managed deployment during validation.

A new Smohix-built replacement requires database API/storage/identity design, secure sessions, password recovery, MFA, OAuth, abuse controls, authorization and durable operations. It cannot be completed safely by renaming Supabase or hiding its browser configuration. The browser's publishable/anon key is intentionally public; service-role keys and signing secrets must stay server-side.

## Validation

Production build and TypeScript validation passed. ESLint passed with no remaining warnings in the scanned application/auth code. All 107 release checks passed through a local TypeScript runtime because tsx has a Windows sandbox environment issue. A real local HTTP test verifies that upstream errors/redirects expose no private body and that authenticated responses cannot inherit public cache headers. The client import audit inspected 61 client roots with zero server-secret module imports.

A local production server returned 200 for products, platform, developers, enterprise, pricing, pilot, trust and status. With identity configuration absent, account/proxy APIs returned safe 503 responses and assets/changes/resilience redirected to sign-in. Database readiness returned a safe 503 without Postgres versions. These are local checks, not proof that signed-in production flows or capacity targets have passed.

## Next steps, in order

1. Review and manually commit/deploy the web hardening changes. Keep the Java payment scaffold disabled and version it separately.
2. Verify real sign-up/sign-in, confirmation, password reset, account/organization isolation, incident ingest, approvals, dry-run/execute gates and billing in a staging workspace with actual deployment credentials.
3. Rehearse database backup restoration and production rollback; verify applied migrations and external service health.
4. Measure representative traffic and concurrent operations before making capacity or enterprise-readiness claims. A fixed 12-month estimate or a promise of millions of requests is not evidence of readiness.
5. Decide whether managed or self-hosted identity meets the business need. Prototype self-hosting in staging, then plan the migration from measured results.

Published packages, Go clients and fully autonomous conditional automation remain outside the current source preview. They must remain honestly labelled until implemented and verified.
