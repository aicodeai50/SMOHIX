-- Legal hold markers: freeze incidents and audit rows from retention purge.

alter table public.incidents
  add column if not exists legal_hold boolean not null default false;

alter table public.incidents
  add column if not exists legal_hold_reason text;

alter table public.incidents
  add column if not exists legal_hold_set_at timestamptz;

alter table public.incidents
  add column if not exists legal_hold_set_by uuid references public.profiles (id) on delete set null;

create index if not exists incidents_org_legal_hold_idx
  on public.incidents (org_id, legal_hold, updated_at desc)
  where org_id is not null and legal_hold = true;

alter table public.audit_log
  add column if not exists legal_hold boolean not null default false;

create index if not exists audit_log_org_legal_hold_idx
  on public.audit_log (org_id, legal_hold, created_at desc)
  where org_id is not null and legal_hold = true;

comment on column public.incidents.legal_hold is
  'When true, incident is excluded from org retention purge and flagged in console.';
comment on column public.audit_log.legal_hold is
  'When true, audit row is excluded from retention purge (including cascade from incident hold).';

-- Respect legal holds during org-scoped purge (replaces migration #23 helpers).
create or replace function public.purge_stale_org_audit_log(
  p_org_id uuid,
  retention_days integer
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count bigint;
begin
  if retention_days < 7 then
    raise exception 'retention_days must be at least 7';
  end if;
  delete from public.audit_log a
  where a.org_id = p_org_id
    and a.legal_hold is not true
    and a.created_at < now() - make_interval(days => retention_days)
    and not exists (
      select 1
      from public.incidents i
      where i.legal_hold = true
        and i.org_id = p_org_id
        and i.id::text = a.details->>'incident_id'
    );
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function public.purge_stale_org_incidents(
  p_org_id uuid,
  retention_days integer
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count bigint;
begin
  if retention_days < 7 then
    raise exception 'retention_days must be at least 7';
  end if;
  delete from public.incidents
  where org_id = p_org_id
    and legal_hold is not true
    and status in ('mitigated', 'resolved', 'monitoring')
    and updated_at < now() - make_interval(days => retention_days);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
