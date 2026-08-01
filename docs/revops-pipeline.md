# RevOps pipeline — leads, pilots, and follow-ups

Sales and pilot-management workflow built on the Phase 3 contact lead system.

## Overview

```
Contact form → contact_leads
       ↓
Admin pipeline (/admin/leads) — stages, owners, follow-ups, activity
       ↓ (manual)
Pilot project (/admin/pilots) — proposal, calendar, status
       ↓
Dashboard (/admin) — counts from live data only
```

## Lead pipeline stages

| Stage | Purpose |
|-------|---------|
| `new` | Just submitted |
| `reviewing` | Triage in progress |
| `contacted` | Outreach attempted |
| `qualified` | Fit confirmed |
| `pilot_proposed` | Pilot record created |
| `pilot_active` | Pilot in progress |
| `won` | Commercial success |
| `closed` | No further action |
| `spam` | Rejected |

Additional fields: `assigned_to`, `next_action`, `follow_up_date`, `priority`, `source_label`, calendar dates.

## Activity history

Table: `lead_activity` (append-only)

Events: `lead_created`, `status_changed`, `assigned`, `note_added`, `follow_up_scheduled`, `contact_attempted`, `pilot_proposed`, `pilot_started`, `lead_won`, `lead_closed`, etc.

Actor is always the signed-in platform admin email from the server — never from the client.

## Pilot management

- List: `/admin/pilots`
- Detail: `/admin/pilots/[id]`
- Create: **Create pilot** on lead detail, or `POST /api/admin/leads/{id}/convert-pilot`
- Statuses: `draft`, `proposed`, `approved`, `active`, `paused`, `completed`, `cancelled`

## Proposal builder

Deterministic template from lead + pilot data — **no AI**.

- JSON: `GET /api/admin/pilots/{id}/proposal`
- HTML (print/PDF-ready): `?format=html`
- Markdown: `?format=markdown`

Includes disclaimer: not a binding contract.

## Follow-up dashboard

`GET /api/admin/dashboard` — UI at `/admin`

Metrics from database only: new leads, overdue follow-ups, pilots awaiting action, active pilots, conversion counts, leads by source/inquiry type, recent activity.

## Email support

Uses existing **Resend** integration when `ZENTRO_RESEND_API_KEY` and `ZENTRO_EMAIL_FROM` are set.

- `POST /api/admin/leads/{id}/email` with `{ templateId, send?: boolean }`
- Default: opens **mailto** draft for human review
- `send: true` sends via Resend (admin must explicitly request)

Templates: enquiry received, request more info, pilot discovery, proposal ready, follow-up, pilot accepted/completed.

## Calendar

No Google OAuth — `.ics` download only:

`GET /api/admin/pilots/{id}/calendar?event=discovery|kickoff|review|all`

## CSV export

- Leads: `GET /api/admin/leads/export` (respects query filters)
- Pilots: `GET /api/admin/pilots/export`

Formula injection prevented. Export timestamp in file header. Admin-only; export logged.

## Database

Migration: `supabase/migrations/20260701120000_revops_pipeline.sql`

Tables: extended `contact_leads`, `lead_activity`, `pilot_projects`, `pilot_activity`

RLS enabled, no public policies — service role via API routes only.

```bash
npm run db:bundle
```

## Admin permissions

Same as Phase 3: `ZENTRO_PLATFORM_ADMIN_EMAILS` comma-separated allowlist + Supabase session.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ZENTRO_PLATFORM_ADMIN_EMAILS` | Admin UI + API access |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage (server only) |
| `ZENTRO_RESEND_API_KEY` | Optional outbound email |
| `ZENTRO_EMAIL_FROM` | Optional sender address |
| `ZENTRO_CONTACT_DEV_STORE=1` | Dev in-memory fallback |

## Deployment checklist

1. Apply migration `20260701120000_revops_pipeline.sql`
2. Run `npm run db:bundle`
3. Confirm `/admin`, `/admin/leads`, `/admin/pilots` for allowlisted admin
4. Test lead stage change → activity row created
5. Test lead → pilot conversion
6. Test CSV export and proposal HTML
7. Configure Resend if sending email from admin UI

## Tests

```bash
npm run test:revops-pipeline
npm run test:contact-leads
```

Included in `verify:release`.

## Recovery

| Issue | Action |
|-------|--------|
| Migration not applied | API updates fail silently or 500 — apply SQL |
| Activity not recording | Check service role; dev store for local |
| Email not sending | Use mailto fallback; configure Resend |
| Pilot not linked | Re-run convert-pilot; check `pilot_project_id` on lead |

See also: [contact-leads.md](./contact-leads.md)
