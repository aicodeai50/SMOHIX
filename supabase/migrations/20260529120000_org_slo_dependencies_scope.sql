-- Extend org scope to SLO configs, error budget snapshots, and dependency edges.
-- Backfill org_id from parent services; legacy per-user rows keep org_id null.

alter table public.service_slos
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

update public.service_slos s
set org_id = sv.org_id
from public.services sv
where s.service_id = sv.id
  and sv.org_id is not null
  and s.org_id is null;

create index if not exists service_slos_org_service_idx
  on public.service_slos (org_id, service_id, updated_at desc)
  where org_id is not null;

create unique index if not exists service_slos_org_service_slo_uidx
  on public.service_slos (org_id, service_id, slo_name)
  where org_id is not null;

create policy "service_slos_select_org"
  on public.service_slos for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "service_slos_insert_org"
  on public.service_slos for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "service_slos_update_org"
  on public.service_slos for update
  using (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

alter table public.error_budget_windows
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

update public.error_budget_windows w
set org_id = sv.org_id
from public.services sv
where w.service_id = sv.id
  and sv.org_id is not null
  and w.org_id is null;

create index if not exists error_budget_windows_org_recorded_idx
  on public.error_budget_windows (org_id, recorded_at desc)
  where org_id is not null;

create index if not exists error_budget_windows_org_service_label_recorded_idx
  on public.error_budget_windows (org_id, service_id, window_label, recorded_at desc)
  where org_id is not null;

create policy "error_budget_windows_select_org"
  on public.error_budget_windows for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "error_budget_windows_insert_org"
  on public.error_budget_windows for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

alter table public.service_dependencies
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

update public.service_dependencies d
set org_id = sv.org_id
from public.services sv
where d.service_id = sv.id
  and sv.org_id is not null
  and d.org_id is null;

create index if not exists service_dependencies_org_service_idx
  on public.service_dependencies (org_id, service_id)
  where org_id is not null;

create unique index if not exists service_dependencies_org_edge_uidx
  on public.service_dependencies (org_id, service_id, depends_on_service_id)
  where org_id is not null;

create policy "service_dependencies_select_org"
  on public.service_dependencies for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "service_dependencies_insert_org"
  on public.service_dependencies for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "service_dependencies_delete_org"
  on public.service_dependencies for delete
  using (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "service_dependencies_update_org"
  on public.service_dependencies for update
  using (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );
