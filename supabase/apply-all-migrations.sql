-- Shynvo: all migrations in one file (run once in Supabase → SQL Editor → Run).
-- Fresh project only. Re-running may error on existing policies/objects.
-- Order: platform_spine → incidents → console_extensions → api_keys → automation_dry_runs.
-- Note: equipment operations tables live in `supabase/migrations/20260420120000_equipment_operations.sql`
-- and should be run after this file for full platform coverage.

-- =============================================================================
-- 20260418120000_platform_spine.sql
-- =============================================================================
-- Shynvo platform spine: profiles, billing subscriptions, webhook idempotency.
-- Apply in Supabase → SQL Editor (or `supabase db push` if you use the CLI).
-- Requires: extensions pgcrypto (usually enabled on Supabase).

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user (created by trigger below).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- subscriptions: Lemon Squeezy subscription rows (written by webhook only).
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  lemon_subscription_id text not null unique,
  lemon_customer_id text,
  lemon_order_id text,
  lemon_product_id text,
  lemon_variant_id text,
  status text not null,
  renews_at timestamptz,
  ends_at timestamptz,
  trial_ends_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- webhook_event_deliveries: idempotent Lemon webhook processing (hash of body).
-- ---------------------------------------------------------------------------
create table if not exists public.webhook_event_deliveries (
  delivery_id text primary key,
  event_name text not null,
  received_at timestamptz not null default now()
);

alter table public.webhook_event_deliveries enable row level security;
-- No policies: only the service role (bypasses RLS) inserts here.

-- ---------------------------------------------------------------------------
-- Auto-create profile when a new auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Keep updated_at fresh on profiles (optional convenience).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- 20260418130000_incidents.sql
-- =============================================================================
-- Incidents (per user). Apply after platform_spine.sql (needs public.profiles).
-- RLS: users only see their own rows.

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists incidents_user_updated_idx
  on public.incidents (user_id, updated_at desc);

alter table public.incidents enable row level security;

create policy "incidents_select_own"
  on public.incidents for select
  using (auth.uid() = user_id);

create policy "incidents_insert_own"
  on public.incidents for insert
  with check (auth.uid() = user_id);

create policy "incidents_update_own"
  on public.incidents for update
  using (auth.uid() = user_id);

create policy "incidents_delete_own"
  on public.incidents for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- 20260418140000_console_extensions.sql
-- =============================================================================
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

-- =============================================================================
-- 20260418150000_api_keys.sql
-- =============================================================================
-- Programmatic access: hashed keys for /api/reasoning and /api/robot when Supabase auth is enabled.
-- Apply after platform_spine (profiles). Service role resolves keys by hash; users manage rows via RLS.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'API key',
  key_prefix text not null,
  secret_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create unique index if not exists api_keys_active_secret_hash_uidx
  on public.api_keys (secret_hash)
  where revoked_at is null;

create index if not exists api_keys_user_created_idx
  on public.api_keys (user_id, created_at desc);

alter table public.api_keys enable row level security;

create policy "api_keys_select_own"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "api_keys_insert_own"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "api_keys_update_own"
  on public.api_keys for update
  using (auth.uid() = user_id);

-- =============================================================================
-- 20260418160000_automation_dry_runs.sql
-- =============================================================================
-- Durable automation dry-run history (per user). Apply after platform_spine.

create table if not exists public.automation_dry_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  playbook_id text not null,
  ok boolean not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists automation_dry_runs_user_created_idx
  on public.automation_dry_runs (user_id, created_at desc);

alter table public.automation_dry_runs enable row level security;

create policy "automation_dry_runs_select_own"
  on public.automation_dry_runs for select
  using (auth.uid() = user_id);

create policy "automation_dry_runs_insert_own"
  on public.automation_dry_runs for insert
  with check (auth.uid() = user_id);

-- =============================================================================
-- 20260419130000_automation_dry_runs_incident_id.sql
-- =============================================================================

alter table public.automation_dry_runs
  add column if not exists incident_id uuid references public.incidents (id) on delete set null;

create index if not exists automation_dry_runs_user_incident_created_idx
  on public.automation_dry_runs (user_id, incident_id, created_at desc);
