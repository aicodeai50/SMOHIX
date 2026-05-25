-- Zentro Postgres excellence upgrade.
-- Extensions, integrity constraints, hot-path indexes, RLS gaps, and retention helpers.
-- Safe to re-run: uses IF NOT EXISTS / guarded DO blocks throughout.
-- Apply after all prior migrations in supabase/migrations/.

-- ---------------------------------------------------------------------------
-- Extensions (Supabase: enable in Dashboard → Database → Extensions if needed)
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists btree_gin;

-- ---------------------------------------------------------------------------
-- Integrity: align incidents.status with application enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'incidents_status_check'
      and conrelid = 'public.incidents'::regclass
  ) then
    alter table public.incidents
      add constraint incidents_status_check
      check (status in ('investigating', 'mitigated', 'resolved', 'monitoring'))
      not valid;
    alter table public.incidents validate constraint incidents_status_check;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Hot-path indexes (query patterns in lib/* and API routes)
-- ---------------------------------------------------------------------------
create index if not exists incidents_user_status_updated_idx
  on public.incidents (user_id, status, updated_at desc);

create index if not exists remediation_runs_user_incident_created_idx
  on public.remediation_runs (user_id, incident_id, created_at desc)
  where incident_id is not null;

create index if not exists automation_executions_user_incident_created_idx
  on public.automation_executions (user_id, incident_id, created_at desc)
  where incident_id is not null;

create index if not exists audit_log_user_event_created_idx
  on public.audit_log (user_id, event_type, created_at desc);

create index if not exists error_budget_windows_user_service_label_recorded_idx
  on public.error_budget_windows (user_id, service_id, window_label, recorded_at desc);

create index if not exists automation_dry_runs_user_playbook_created_idx
  on public.automation_dry_runs (user_id, playbook_id, created_at desc);

-- JSONB search for audit detail payloads (policy analytics, incident context)
create index if not exists audit_log_details_gin_idx
  on public.audit_log using gin (details jsonb_path_ops);

-- ---------------------------------------------------------------------------
-- RLS: service_dependencies was missing update policy
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'service_dependencies'
      and policyname = 'service_dependencies_update_own'
  ) then
    create policy "service_dependencies_update_own"
      on public.service_dependencies for update
      using (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Retention helpers (invoke via service role + pg_cron or Supabase scheduled SQL)
-- ---------------------------------------------------------------------------
create or replace function public.purge_stale_audit_log(retention_days integer default 180)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  if retention_days < 7 then
    raise exception 'retention_days must be at least 7';
  end if;
  delete from public.audit_log
  where created_at < now() - make_interval(days => retention_days);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

create or replace function public.purge_stale_error_budget_windows(retention_days integer default 90)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  if retention_days < 7 then
    raise exception 'retention_days must be at least 7';
  end if;
  delete from public.error_budget_windows
  where recorded_at < now() - make_interval(days => retention_days);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

create or replace function public.purge_stale_automation_dry_runs(retention_days integer default 60)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted bigint;
begin
  if retention_days < 7 then
    raise exception 'retention_days must be at least 7';
  end if;
  delete from public.automation_dry_runs
  where created_at < now() - make_interval(days => retention_days);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke all on function public.purge_stale_audit_log(integer) from public;
revoke all on function public.purge_stale_error_budget_windows(integer) from public;
revoke all on function public.purge_stale_automation_dry_runs(integer) from public;

grant execute on function public.purge_stale_audit_log(integer) to service_role;
grant execute on function public.purge_stale_error_budget_windows(integer) to service_role;
grant execute on function public.purge_stale_automation_dry_runs(integer) to service_role;

-- ---------------------------------------------------------------------------
-- DB health probe (used by GET /api/health/db)
-- ---------------------------------------------------------------------------
create or replace function public.zentro_db_health()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'postgres_version', current_setting('server_version'),
    'server_time', now()
  );
$$;

revoke all on function public.zentro_db_health() from public;
grant execute on function public.zentro_db_health() to service_role;
grant execute on function public.zentro_db_health() to authenticated;
