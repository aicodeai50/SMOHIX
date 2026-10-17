-- Targeted recovery for confirmed workspace schema errors.
-- Execute against the same Supabase project used by the Smohix web service.
-- Preserves records and existing policies. Does not mark historical migrations applied.
-- Requires the existing platform profiles/subscriptions tables.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
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
    'owner', 'admin', 'operator', 'approver', 'security_reviewer', 'viewer', 'auditor'
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

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Organizations + members policies
-- ---------------------------------------------------------------------------
do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_select_member') then
    create policy "organizations_select_member"
  on public.organizations for select
  using (public.is_org_member(id));
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_insert_creator') then
    create policy "organizations_insert_creator"
  on public.organizations for insert
  with check (created_by = auth.uid());
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_update_admin') then
    create policy "organizations_update_admin"
  on public.organizations for update
  using (public.has_org_role(id, array['owner', 'admin']));
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_members' and policyname = 'organization_members_select_member') then
    create policy "organization_members_select_member"
  on public.organization_members for select
  using (public.is_org_member(org_id));
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_members' and policyname = 'organization_members_insert_admin') then
    create policy "organization_members_insert_admin"
  on public.organization_members for insert
  with check (public.has_org_role(org_id, array['owner', 'admin']));
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_members' and policyname = 'organization_members_update_admin') then
    create policy "organization_members_update_admin"
  on public.organization_members for update
  using (public.has_org_role(org_id, array['owner', 'admin']));
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'organization_members' and policyname = 'organization_members_delete_admin') then
    create policy "organization_members_delete_admin"
  on public.organization_members for delete
  using (
    public.has_org_role(org_id, array['owner', 'admin'])
    and role <> 'owner'
  );
  end if;
end $policy$;



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

revoke all on function public.create_organization_for_user(text) from public;
grant execute on function public.create_organization_for_user(text) to authenticated;


alter table public.subscriptions
  add column if not exists paypal_subscription_id text,
  add column if not exists paypal_plan_id text,
  add column if not exists org_id uuid references public.organizations(id) on delete cascade;

create unique index if not exists subscriptions_paypal_subscription_id_idx
  on public.subscriptions(paypal_subscription_id)
  where paypal_subscription_id is not null;

grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;

notify pgrst, 'reload schema';
commit;
