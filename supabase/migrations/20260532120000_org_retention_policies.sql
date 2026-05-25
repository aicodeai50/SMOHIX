-- Org-level retention overrides aligned with deployment tier (Enterprise custom retention).
-- Null columns inherit tier defaults; purge helpers respect org_id scope.

alter table public.organizations
  add column if not exists audit_retention_days integer
    check (audit_retention_days is null or audit_retention_days >= 7);

alter table public.organizations
  add column if not exists incident_retention_days integer
    check (incident_retention_days is null or incident_retention_days >= 7);

comment on column public.organizations.audit_retention_days is
  'Optional org override for audit_log retention (days). Null = deployment tier default.';
comment on column public.organizations.incident_retention_days is
  'Optional org override for closed incident retention (days). Null = deployment tier default.';

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
  delete from public.audit_log
  where org_id = p_org_id
    and created_at < now() - make_interval(days => retention_days);
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
    and status in ('mitigated', 'resolved', 'monitoring')
    and updated_at < now() - make_interval(days => retention_days);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

create or replace function public.apply_org_retention_policy(p_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_audit_days integer;
  v_incident_days integer;
  v_audit_deleted bigint := 0;
  v_incident_deleted bigint := 0;
begin
  select
    deployment_tier,
    coalesce(audit_retention_days, case deployment_tier
      when 'fedramp_ready' then 365
      when 'regulated' then 180
      else 90
    end),
    coalesce(incident_retention_days, case deployment_tier
      when 'fedramp_ready' then 730
      when 'regulated' then 365
      else 90
    end)
  into v_tier, v_audit_days, v_incident_days
  from public.organizations
  where id = p_org_id;

  if v_tier is null then
    raise exception 'organization not found';
  end if;

  v_audit_deleted := public.purge_stale_org_audit_log(p_org_id, v_audit_days);
  v_incident_deleted := public.purge_stale_org_incidents(p_org_id, v_incident_days);

  return jsonb_build_object(
    'org_id', p_org_id,
    'deployment_tier', v_tier,
    'audit_retention_days', v_audit_days,
    'incident_retention_days', v_incident_days,
    'audit_rows_deleted', v_audit_deleted,
    'incident_rows_deleted', v_incident_deleted
  );
end;
$$;

revoke all on function public.purge_stale_org_audit_log(uuid, integer) from public;
revoke all on function public.purge_stale_org_incidents(uuid, integer) from public;
revoke all on function public.apply_org_retention_policy(uuid) from public;

grant execute on function public.purge_stale_org_audit_log(uuid, integer) to service_role;
grant execute on function public.purge_stale_org_incidents(uuid, integer) to service_role;
grant execute on function public.apply_org_retention_policy(uuid) to service_role;
