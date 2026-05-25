-- Extend org scope to incidents, services, and automation execution history.
-- Backward compatible: org_id null keeps existing per-user RLS policies.

alter table public.incidents
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

create index if not exists incidents_org_updated_idx
  on public.incidents (org_id, updated_at desc)
  where org_id is not null;

create unique index if not exists incidents_org_external_ref_uidx
  on public.incidents (org_id, external_ref)
  where org_id is not null and external_ref is not null and length(trim(external_ref)) > 0;

create policy "incidents_select_org"
  on public.incidents for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "incidents_insert_org"
  on public.incidents for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "incidents_update_org"
  on public.incidents for update
  using (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "incidents_delete_org"
  on public.incidents for delete
  using (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

alter table public.services
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

create index if not exists services_org_updated_idx
  on public.services (org_id, updated_at desc)
  where org_id is not null;

create policy "services_select_org"
  on public.services for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "services_insert_org"
  on public.services for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "services_update_org"
  on public.services for update
  using (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "services_delete_org"
  on public.services for delete
  using (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

alter table public.automation_dry_runs
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

create index if not exists automation_dry_runs_org_created_idx
  on public.automation_dry_runs (org_id, created_at desc)
  where org_id is not null;

create policy "automation_dry_runs_select_org"
  on public.automation_dry_runs for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "automation_dry_runs_insert_org"
  on public.automation_dry_runs for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

alter table public.automation_executions
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

create index if not exists automation_executions_org_created_idx
  on public.automation_executions (org_id, created_at desc)
  where org_id is not null;

create policy "automation_executions_select_org"
  on public.automation_executions for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "automation_executions_insert_org"
  on public.automation_executions for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );
