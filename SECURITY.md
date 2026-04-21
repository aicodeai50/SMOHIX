# Security Guidelines

This project treats operational metadata exposure as a security concern.

## Public Exposure Rules

Do **not** expose the following in public routes/pages:

- Deployment fingerprints (`commit`, deployment IDs, replica IDs, environment names)
- Raw backend connector URLs (especially paths/query strings)
- Secrets, API keys, ingest tokens, or token-like values

Public operational endpoints/pages should return only minimum-safe data needed for UX/health signaling.

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

## Verification Before Merge

Run:

```bash
npm run verify:release
```

This includes:

- API catalog verification
- Security regression checks for metadata exposure and hardening guardrails

## PR Expectations

Follow `.github/pull_request_template.md` and complete the security checklist before merge.
