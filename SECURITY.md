# Security Guidelines

Shynvo treats both metadata exposure and unsafe execution paths as security concerns.

## Public Exposure Rules

Do **not** expose the following in public routes/pages:

- Deployment fingerprints (`commit`, deployment IDs, replica IDs, environment names)
- Raw backend connector URLs (especially paths/query strings)
- Secrets, API keys, ingest tokens, or token-like values

Public operational endpoints/pages should return only minimum-safe data needed for UX/health signaling.

## Runtime Guardrail Rules

Execution paths that can change production state must enforce policy controls at runtime, not just in UI:

- Require a successful fresh dry-run before execution
- Enforce change-window requirements when policies require them
- Enforce blast-radius limits from accepted policy rows
- Block execution when guardrails fail and emit an immutable audit event
- Record machine-readable block reason codes for trend analysis and remediation

## Required Protections

For operational metadata endpoints (for example `/api/health`, `/api/connectors/status`):

- `Cache-Control: no-store, max-age=0`
- `X-Robots-Tag: noindex, nofollow`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `X-Frame-Options: DENY`
- `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- `Cross-Origin-Resource-Policy: same-origin`

## Routing & Indexing Controls

- Keep sensitive operational pages out of sitemap.
- Disallow sensitive operational paths in `robots`.
- Use page-level `noindex` where needed.

## Auditability Requirements

- Security-relevant actions must append to `audit_log` via server-side paths.
- Guardrail blocks should capture both:
  - human-readable reason text
  - normalized reason code
- User-facing policy/governance flows should preserve enough context to support reviewer remediation.

## Verification Before Merge

Run:

```bash
npm run verify:release
```

This includes:

- API catalog verification
- Security regression checks for metadata exposure and hardening guardrails
- Decision-intelligence guardrail checks (policy enforcement and governance review flows)

## PR Expectations

Follow `.github/pull_request_template.md` and complete the security checklist before merge.
