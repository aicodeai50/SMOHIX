-- Hub module personalization — per-user quick links and pinned nav modules.

create table if not exists public.user_console_hub_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  quick_link_hrefs jsonb not null default '[]'::jsonb,
  pinned_hrefs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists user_console_hub_prefs_updated_at_idx
  on public.user_console_hub_prefs (updated_at desc);

alter table public.user_console_hub_prefs enable row level security;

create policy "user_console_hub_prefs_select_own"
  on public.user_console_hub_prefs for select
  using (auth.uid() = user_id);

create policy "user_console_hub_prefs_insert_own"
  on public.user_console_hub_prefs for insert
  with check (auth.uid() = user_id);

create policy "user_console_hub_prefs_update_own"
  on public.user_console_hub_prefs for update
  using (auth.uid() = user_id);

comment on table public.user_console_hub_prefs is
  'Per-user hub quick link order and pinned console modules for nav rail priority.';
