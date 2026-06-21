-- Incident command loop: assignees, collaboration events, and per-user notifications.
-- Keeps existing incidents backward compatible while adding org-aware response workflow.

alter table public.incidents
  add column if not exists assigned_user_id uuid references public.profiles (id) on delete set null;

create index if not exists incidents_assigned_user_idx
  on public.incidents (assigned_user_id, updated_at desc)
  where assigned_user_id is not null;

create table if not exists public.incident_command_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  org_id uuid references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in ('comment', 'handoff', 'copilot_context')),
  body text not null check (length(trim(body)) > 0 and length(body) <= 4000),
  target_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists incident_command_events_incident_created_idx
  on public.incident_command_events (incident_id, created_at desc);

create index if not exists incident_command_events_org_created_idx
  on public.incident_command_events (org_id, created_at desc)
  where org_id is not null;

alter table public.incident_command_events enable row level security;

create policy "incident_command_events_select_org"
  on public.incident_command_events for select
  using (
    org_id is not null
    and public.is_org_member(org_id)
  );

create policy "incident_command_events_select_own"
  on public.incident_command_events for select
  using (
    org_id is null
    and user_id = auth.uid()
  );

create policy "incident_command_events_insert_org"
  on public.incident_command_events for insert
  with check (
    user_id = auth.uid()
    and org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator', 'approver', 'security_reviewer'])
  );

create policy "incident_command_events_insert_own"
  on public.incident_command_events for insert
  with check (
    user_id = auth.uid()
    and org_id is null
  );

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  incident_id uuid references public.incidents (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

create index if not exists user_notifications_unread_idx
  on public.user_notifications (user_id, created_at desc)
  where read_at is null;

alter table public.user_notifications enable row level security;

create policy "user_notifications_select_own"
  on public.user_notifications for select
  using (user_id = auth.uid());

create policy "user_notifications_update_own"
  on public.user_notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_notifications_insert_org_members"
  on public.user_notifications for insert
  with check (
    org_id is not null
    and public.is_org_member(org_id)
  );
