-- Service dependency graph + guarded remediation run records.

create table if not exists public.service_dependencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  depends_on_service_id uuid not null references public.services (id) on delete cascade,
  relationship text not null default 'runtime' check (relationship in ('runtime', 'data', 'network', 'auth', 'other')),
  criticality text not null default 'medium' check (criticality in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  unique (user_id, service_id, depends_on_service_id)
);

create index if not exists service_dependencies_user_service_idx
  on public.service_dependencies (user_id, service_id);

alter table public.service_dependencies enable row level security;

create policy "service_dependencies_select_own"
  on public.service_dependencies for select
  using (auth.uid() = user_id);

create policy "service_dependencies_insert_own"
  on public.service_dependencies for insert
  with check (auth.uid() = user_id);

create policy "service_dependencies_delete_own"
  on public.service_dependencies for delete
  using (auth.uid() = user_id);

create table if not exists public.remediation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  incident_id uuid references public.incidents (id) on delete set null,
  playbook_id text not null,
  trigger_source text not null check (trigger_source in ('incident', 'automation', 'manual')),
  dry_run_ok boolean not null default false,
  approval_note text not null,
  rollback_plan text not null,
  execution_ok boolean not null default false,
  execution_mode text not null check (execution_mode in ('simulated', 'connector')),
  blocked_reason text,
  guardrail_checks_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists remediation_runs_user_created_idx
  on public.remediation_runs (user_id, created_at desc);

alter table public.remediation_runs enable row level security;

create policy "remediation_runs_select_own"
  on public.remediation_runs for select
  using (auth.uid() = user_id);

create policy "remediation_runs_insert_own"
  on public.remediation_runs for insert
  with check (auth.uid() = user_id);
