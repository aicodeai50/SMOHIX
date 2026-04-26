-- Change risk scoring persistence for execution-time enforcement and analytics.

create table if not exists public.change_risk_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  playbook_id text not null,
  incident_id uuid references public.incidents (id) on delete set null,
  execution_id uuid references public.automation_executions (id) on delete set null,
  risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
  risk_tier text not null check (risk_tier in ('low', 'medium', 'high', 'critical')),
  factors_json jsonb not null default '[]'::jsonb,
  blocked boolean not null default false,
  blocked_reason text,
  created_at timestamptz not null default now()
);

create index if not exists change_risk_scores_user_created_idx
  on public.change_risk_scores (user_id, created_at desc);

create index if not exists change_risk_scores_user_tier_created_idx
  on public.change_risk_scores (user_id, risk_tier, created_at desc);

alter table public.change_risk_scores enable row level security;

create policy "change_risk_scores_select_own"
  on public.change_risk_scores for select
  using (auth.uid() = user_id);

create policy "change_risk_scores_insert_own"
  on public.change_risk_scores for insert
  with check (auth.uid() = user_id);
