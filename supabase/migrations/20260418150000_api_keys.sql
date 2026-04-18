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
