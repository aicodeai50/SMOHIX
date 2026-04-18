-- Approvals, audit trail, Copilot threads — apply after platform_spine + incidents migrations.

-- ---------------------------------------------------------------------------
-- approval_requests
-- ---------------------------------------------------------------------------
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action_label text not null,
  requested_by text,
  policy_hint text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists approval_requests_user_status_idx
  on public.approval_requests (user_id, status, updated_at desc);

alter table public.approval_requests enable row level security;

create policy "approval_requests_select_own"
  on public.approval_requests for select
  using (auth.uid() = user_id);

create policy "approval_requests_insert_own"
  on public.approval_requests for insert
  with check (auth.uid() = user_id);

create policy "approval_requests_update_own"
  on public.approval_requests for update
  using (auth.uid() = user_id);

drop trigger if exists approval_requests_set_updated_at on public.approval_requests;
create trigger approval_requests_set_updated_at
  before update on public.approval_requests
  for each row
  execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_log (read own rows; inserts via service role from webhooks / jobs)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  user_id uuid references public.profiles (id) on delete set null,
  details jsonb
);

create index if not exists audit_log_user_created_idx
  on public.audit_log (user_id, created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log_select_own"
  on public.audit_log for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Copilot threads + messages
-- ---------------------------------------------------------------------------
create table if not exists public.copilot_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists copilot_threads_user_updated_idx
  on public.copilot_threads (user_id, updated_at desc);

alter table public.copilot_threads enable row level security;

create policy "copilot_threads_select_own"
  on public.copilot_threads for select
  using (auth.uid() = user_id);

create policy "copilot_threads_insert_own"
  on public.copilot_threads for insert
  with check (auth.uid() = user_id);

create policy "copilot_threads_update_own"
  on public.copilot_threads for update
  using (auth.uid() = user_id);

create policy "copilot_threads_delete_own"
  on public.copilot_threads for delete
  using (auth.uid() = user_id);

drop trigger if exists copilot_threads_set_updated_at on public.copilot_threads;
create trigger copilot_threads_set_updated_at
  before update on public.copilot_threads
  for each row
  execute procedure public.set_updated_at();

create table if not exists public.copilot_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.copilot_threads (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists copilot_messages_thread_created_idx
  on public.copilot_messages (thread_id, created_at asc);

alter table public.copilot_messages enable row level security;

create policy "copilot_messages_select_via_thread"
  on public.copilot_messages for select
  using (
    exists (
      select 1 from public.copilot_threads t
      where t.id = copilot_messages.thread_id and t.user_id = auth.uid()
    )
  );

create policy "copilot_messages_insert_via_thread"
  on public.copilot_messages for insert
  with check (
    exists (
      select 1 from public.copilot_threads t
      where t.id = copilot_messages.thread_id and t.user_id = auth.uid()
    )
  );
