-- Link dry-runs to incidents for history, joins, and overview intelligence.
-- Apply after 20260418160000_automation_dry_runs.sql and 20260418130000_incidents.sql.

alter table public.automation_dry_runs
  add column if not exists incident_id uuid references public.incidents (id) on delete set null;

create index if not exists automation_dry_runs_user_incident_created_idx
  on public.automation_dry_runs (user_id, incident_id, created_at desc);

comment on column public.automation_dry_runs.incident_id is
  'Optional incident context when dry-run was started from /automations?incident=…';
