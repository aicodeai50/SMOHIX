-- Decision intelligence persistence:
-- 1) immutable approval brief snapshot
-- 2) dedicated automation execution outcomes
-- 3) policy suggestion review lifecycle

alter table public.approval_requests
  add column if not exists decision_brief_json jsonb;

create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  playbook_id text not null,
  ok boolean not null,
  mode text not null check (mode in ('simulated', 'connector')),
  rollback_plan text not null,
  approval_note text not null,
  incident_id uuid references public.incidents (id) on delete set null,
  decision_brief_json jsonb,
  expected_outcome_json jsonb,
  actual_outcome_json jsonb,
  decision_accuracy_score numeric(5,2),
  policy_suggestions_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists automation_executions_user_created_idx
  on public.automation_executions (user_id, created_at desc);
create index if not exists automation_executions_user_playbook_created_idx
  on public.automation_executions (user_id, playbook_id, created_at desc);

alter table public.automation_executions enable row level security;

create policy "automation_executions_select_own"
  on public.automation_executions for select
  using (auth.uid() = user_id);

create policy "automation_executions_insert_own"
  on public.automation_executions for insert
  with check (auth.uid() = user_id);

create table if not exists public.policy_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  playbook_id text not null,
  suggestion_key text not null,
  label text not null,
  reason text not null,
  confidence_score integer not null check (confidence_score >= 0 and confidence_score <= 100),
  guardrails_json jsonb not null default '[]'::jsonb,
  status text not null default 'proposed'
    check (status in ('proposed', 'reviewed', 'accepted', 'rejected')),
  reviewer_notes text,
  promoted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists policy_suggestions_user_key_uidx
  on public.policy_suggestions (user_id, suggestion_key);
create index if not exists policy_suggestions_user_status_created_idx
  on public.policy_suggestions (user_id, status, created_at desc);

alter table public.policy_suggestions enable row level security;

create policy "policy_suggestions_select_own"
  on public.policy_suggestions for select
  using (auth.uid() = user_id);

create policy "policy_suggestions_insert_own"
  on public.policy_suggestions for insert
  with check (auth.uid() = user_id);

create policy "policy_suggestions_update_own"
  on public.policy_suggestions for update
  using (auth.uid() = user_id);

drop trigger if exists policy_suggestions_set_updated_at on public.policy_suggestions;
create trigger policy_suggestions_set_updated_at
  before update on public.policy_suggestions
  for each row
  execute procedure public.set_updated_at();
