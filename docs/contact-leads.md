# Contact lead intake — architecture and operations

Operational pipeline for zentro.run marketing enquiries: validate → store → notify → admin review.

## Flow

```
Visitor (ContactForm)
  → POST /api/contact
  → validate + rate limit + duplicate check
  → Supabase contact_leads (service role)
  → notification webhook/Slack (best-effort)
  → JSON { success, referenceId }
```

Admin review: `/admin/leads` (platform admin email allowlist).

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Auth + DB |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | **Server only** — never `NEXT_PUBLIC_*` |
| `ZENTRO_PLATFORM_ADMIN_EMAILS` | Admin UI | Comma-separated allowlist |
| `ZENTRO_CONTACT_WEBHOOK_URL` | Optional | Generic JSON webhook for new leads |
| `ZENTRO_SLACK_WEBHOOK_URL` | Optional | Reuses existing Slack integration |
| `ZENTRO_CONTACT_HASH_SALT` | Recommended | Rate-limit key hashing |
| `ZENTRO_CONTACT_DEV_STORE` | Local dev | Set `1` with `NODE_ENV=development` for in-memory fallback |
| `NEXT_PUBLIC_ANALYTICS_REQUIRES_CONSENT` | Optional | Enables consent banner |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Optional | `plausible` or `console` |

## Database

Migration: `supabase/migrations/20260630120000_contact_leads.sql`

Apply via Supabase CLI or dashboard SQL editor, then run:

```bash
npm run db:bundle
```

### RLS

- Row Level Security **enabled**
- **No policies** for `anon` / `authenticated` — public clients cannot read, update, or delete leads
- Inserts and admin queries use **service role** in Next.js API routes only

### Indexes

- `created_at`, `inquiry_type`, `status`, `lower(email)`

## API

### `POST /api/contact`

Success (`201`):

```json
{ "success": true, "referenceId": "ZEN-A1B2C3" }
```

Validation (`400`):

```json
{ "success": false, "code": "VALIDATION_ERROR", "fieldErrors": { "email": "..." } }
```

Rate limit (`429`):

```json
{ "success": false, "code": "RATE_LIMITED", "message": "Too many submissions..." }
```

### `GET/PATCH /api/admin/leads`

Requires signed-in user whose email is in `ZENTRO_PLATFORM_ADMIN_EMAILS`.

## Security controls

- Honeypot field (`website`)
- Minimum submit duration (`MIN_SUBMIT_MS` = 2500)
- Per-IP and per-email rate limits (hashed identifiers)
- Duplicate detection (24h, email + problem fingerprint)
- Payload size cap (16 KiB)
- HTML stripping on text fields
- Structured logs never include full email, name, or message body

## Notifications

Provider interface in `lib/contact/notifications.ts`. Order: webhook → Slack → noop.

**Notification failure does not roll back storage.** Failures log `contact_notification_failed`.

## Pilot workflow

When `inquiry_type = pilot`:

- `metadata.is_pilot = true`
- `pilot_category` from form/URL param
- `metadata.pilot_qualification_score` (0–6, deterministic rules in `lib/contact/leads.ts`)
- Score is internal only — leads are never auto-rejected

## Admin access

1. User signs in via Supabase auth
2. Server checks email against `ZENTRO_PLATFORM_ADMIN_EMAILS`
3. Non-admin signed-in users see **Access denied** (403 UX)
4. Unauthenticated users redirect to sign-in

## Local development

```bash
# .env.local
ZENTRO_CONTACT_DEV_STORE=1
ZENTRO_PLATFORM_ADMIN_EMAILS=you@yourcompany.com
```

Without service role, set `ZENTRO_CONTACT_DEV_STORE=1` for in-memory leads.

## Deployment checklist

- [ ] Run migration on production Supabase
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` on Railway (server-only)
- [ ] Set `ZENTRO_PLATFORM_ADMIN_EMAILS`
- [ ] Configure `ZENTRO_CONTACT_WEBHOOK_URL` or `ZENTRO_SLACK_WEBHOOK_URL`
- [ ] Set `ZENTRO_CONTACT_HASH_SALT` (unique per environment)
- [ ] Verify `POST /api/contact` returns reference ID
- [ ] Verify `/admin/leads` for allowlisted admin
- [ ] Confirm service role key absent from client bundle

## Recovery

| Failure | Impact | Action |
|---------|--------|--------|
| Storage down | 503 to visitor; mailto fallback in UI | Fix Supabase; leads not stored until restored |
| Notification down | Lead stored; admin not pinged | Check webhook/Slack; review `/admin/leads` manually |
| Rate limit false positive | 429 to visitor | Adjust limits or wait window; check Upstash if configured |

## Changelog sync (future)

Adapter: `lib/changelog/github-sync.ts` — GitHub release → draft entries → human review → publish.

Requires `GITHUB_TOKEN` and `GITHUB_CHANGELOG_REPO`. Does not auto-publish.

## Tests

```bash
npm run test:contact-leads
```

Included in `verify:release` / `npm run build`.
