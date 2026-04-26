-- Incident RCA runs:
-- Stores generated root-cause hypotheses with evidence and confidence.

create table if not exists public.incident_rca_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  incident_id uuid not null references public.incidents (id) on delete cascade,
  hypothesis_json jsonb not null default '{}'::jsonb,
  confidence_score integer not null default 0 check (confidence_score >= 0 and confidence_score <= 100),
  evidence_refs_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists incident_rca_runs_user_incident_created_idx
  on public.incident_rca_runs (user_id, incident_id, created_at desc);

alter table public.incident_rca_runs enable row level security;

create policy "incident_rca_runs_select_own"
  on public.incident_rca_runs for select
  using (auth.uid() = user_id);

create policy "incident_rca_runs_insert_own"
  on public.incident_rca_runs for insert
  with check (auth.uid() = user_id);
