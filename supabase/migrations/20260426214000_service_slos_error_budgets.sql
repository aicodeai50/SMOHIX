-- Service SLOs + error budget windows for reliability intelligence.

create table if not exists public.service_slos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  slo_name text not null default 'Availability',
  target_percent numeric(5,2) not null check (target_percent > 0 and target_percent < 100),
  window_days integer not null default 30 check (window_days in (7, 30, 90)),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, service_id, slo_name)
);

create index if not exists service_slos_user_service_idx
  on public.service_slos (user_id, service_id, updated_at desc);

alter table public.service_slos enable row level security;

create policy "service_slos_select_own"
  on public.service_slos for select
  using (auth.uid() = user_id);

create policy "service_slos_insert_own"
  on public.service_slos for insert
  with check (auth.uid() = user_id);

create policy "service_slos_update_own"
  on public.service_slos for update
  using (auth.uid() = user_id);

drop trigger if exists service_slos_set_updated_at on public.service_slos;
create trigger service_slos_set_updated_at
  before update on public.service_slos
  for each row
  execute procedure public.set_updated_at();

create table if not exists public.error_budget_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  slo_id uuid references public.service_slos (id) on delete set null,
  window_label text not null check (window_label in ('7d', '30d')),
  incidents_count integer not null default 0,
  budget_used_percent numeric(5,2) not null default 0,
  burn_rate numeric(6,2) not null default 0,
  state text not null default 'healthy' check (state in ('healthy', 'warning', 'critical')),
  recorded_at timestamptz not null default now()
);

create index if not exists error_budget_windows_user_recorded_idx
  on public.error_budget_windows (user_id, recorded_at desc);

alter table public.error_budget_windows enable row level security;

create policy "error_budget_windows_select_own"
  on public.error_budget_windows for select
  using (auth.uid() = user_id);

create policy "error_budget_windows_insert_own"
  on public.error_budget_windows for insert
  with check (auth.uid() = user_id);
