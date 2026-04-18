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
