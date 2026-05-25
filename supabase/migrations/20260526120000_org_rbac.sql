-- Organization-scoped RBAC: shared workspaces, delegated approvers, security reviewer roles.
-- Apply after platform_spine. Backward compatible: rows with org_id null keep per-user RLS.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_created_by_idx
  on public.organizations (created_by, created_at desc);

alter table public.organizations enable row level security;

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in (
    'owner', 'admin', 'operator', 'approver', 'security_reviewer', 'viewer'
  )),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists organization_members_user_idx
  on public.organization_members (user_id, org_id);

alter table public.organization_members enable row level security;

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Organizations + members policies
-- ---------------------------------------------------------------------------
create policy "organizations_select_member"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "organizations_insert_creator"
  on public.organizations for insert
  with check (created_by = auth.uid());

create policy "organizations_update_admin"
  on public.organizations for update
  using (public.has_org_role(id, array['owner', 'admin']));

create policy "organization_members_select_member"
  on public.organization_members for select
  using (public.is_org_member(org_id));

create policy "organization_members_insert_admin"
  on public.organization_members for insert
  with check (public.has_org_role(org_id, array['owner', 'admin']));

create policy "organization_members_update_admin"
  on public.organization_members for update
  using (public.has_org_role(org_id, array['owner', 'admin']));

create policy "organization_members_delete_admin"
  on public.organization_members for delete
  using (
    public.has_org_role(org_id, array['owner', 'admin'])
    and role <> 'owner'
  );

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row
  execute procedure public.set_updated_at();

-- Bootstrap org + owner membership (security definer)
create or replace function public.create_organization_for_user(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.organizations (name, created_by)
  values (left(trim(p_name), 200), v_uid)
  returning id into v_org_id;

  insert into public.organization_members (org_id, user_id, role)
  values (v_org_id, v_uid, 'owner');

  return v_org_id;
end;
$$;

grant execute on function public.create_organization_for_user(text) to authenticated;

-- ---------------------------------------------------------------------------
-- approval_requests: org scope + delegated approvers
-- ---------------------------------------------------------------------------
alter table public.approval_requests
  add column if not exists org_id uuid references public.organizations (id) on delete cascade,
  add column if not exists requester_id uuid references public.profiles (id) on delete set null,
  add column if not exists decided_by uuid references public.profiles (id) on delete set null;

create index if not exists approval_requests_org_status_idx
  on public.approval_requests (org_id, status, updated_at desc)
  where org_id is not null;

create policy "approval_requests_select_org"
  on public.approval_requests for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "approval_requests_insert_org"
  on public.approval_requests for insert
  with check (
    org_id is not null
    and requester_id = auth.uid()
    and public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "approval_requests_update_org_decide"
  on public.approval_requests for update
  using (
    org_id is not null
    and status = 'pending'
    and public.has_org_role(org_id, array['owner', 'admin', 'approver', 'security_reviewer'])
  );

-- policy_suggestions: org visibility for shared review queues
alter table public.policy_suggestions
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

create index if not exists policy_suggestions_org_status_idx
  on public.policy_suggestions (org_id, status, created_at desc)
  where org_id is not null;

create policy "policy_suggestions_select_org"
  on public.policy_suggestions for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "policy_suggestions_update_org_reviewer"
  on public.policy_suggestions for update
  using (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'security_reviewer'])
  );
