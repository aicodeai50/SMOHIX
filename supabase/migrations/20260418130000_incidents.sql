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
