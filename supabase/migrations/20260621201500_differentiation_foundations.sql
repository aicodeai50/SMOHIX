-- Differentiation foundations: change/deploy correlation, policy-as-code versions,
-- and step-level remediation execution receipts.

create table if not exists public.change_deploy_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  incident_id uuid references public.incidents (id) on delete set null,
  provider text not null default 'manual',
  deployment_id text,
  commit_sha text,
  environment text,
  status text not null default 'succeeded' check (status in ('started', 'succeeded', 'failed', 'rolled_back')),
  summary text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists change_deploy_events_org_occurred_idx
  on public.change_deploy_events (org_id, occurred_at desc)
  where org_id is not null;

create index if not exists change_deploy_events_incident_occurred_idx
  on public.change_deploy_events (incident_id, occurred_at desc)
  where incident_id is not null;

alter table public.change_deploy_events enable row level security;

create policy "change_deploy_events_select_org"
  on public.change_deploy_events for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "change_deploy_events_insert_org"
  on public.change_deploy_events for insert
  with check (
    org_id is not null
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "change_deploy_events_select_own"
  on public.change_deploy_events for select
  using (org_id is null and user_id = auth.uid());

create policy "change_deploy_events_insert_own"
  on public.change_deploy_events for insert
  with check (org_id is null and user_id = auth.uid());

create table if not exists public.automation_policy_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  playbook_id text not null,
  version integer not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  policy_json jsonb not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (user_id, playbook_id, version)
);

create index if not exists automation_policy_versions_org_playbook_idx
  on public.automation_policy_versions (org_id, playbook_id, version desc)
  where org_id is not null;

alter table public.automation_policy_versions enable row level security;

create policy "automation_policy_versions_select_org"
  on public.automation_policy_versions for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "automation_policy_versions_manage_org"
  on public.automation_policy_versions for all
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin', 'operator']))
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "automation_policy_versions_select_own"
  on public.automation_policy_versions for select
  using (org_id is null and user_id = auth.uid());

create policy "automation_policy_versions_manage_own"
  on public.automation_policy_versions for all
  using (org_id is null and user_id = auth.uid())
  with check (org_id is null and user_id = auth.uid());

alter table public.remediation_runs
  add column if not exists org_id uuid references public.organizations (id) on delete cascade,
  add column if not exists execution_receipt_json jsonb not null default '{}'::jsonb;

create index if not exists remediation_runs_org_created_idx
  on public.remediation_runs (org_id, created_at desc)
  where org_id is not null;

create policy "remediation_runs_select_org"
  on public.remediation_runs for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "remediation_runs_insert_org"
  on public.remediation_runs for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create table if not exists public.remediation_run_steps (
  id uuid primary key default gen_random_uuid(),
  remediation_run_id uuid not null references public.remediation_runs (id) on delete cascade,
  step_order integer not null,
  label text not null,
  status text not null check (status in ('planned', 'running', 'succeeded', 'failed', 'skipped')),
  output_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (remediation_run_id, step_order)
);

alter table public.remediation_run_steps enable row level security;

create policy "remediation_run_steps_select_via_run"
  on public.remediation_run_steps for select
  using (
    exists (
      select 1 from public.remediation_runs r
      where r.id = remediation_run_steps.remediation_run_id
      and (
        r.user_id = auth.uid()
        or (r.org_id is not null and public.is_org_member(r.org_id))
      )
    )
  );

create policy "remediation_run_steps_insert_via_run"
  on public.remediation_run_steps for insert
  with check (
    exists (
      select 1 from public.remediation_runs r
      where r.id = remediation_run_steps.remediation_run_id
      and (
        r.user_id = auth.uid()
        or (r.org_id is not null and public.has_org_role(r.org_id, array['owner', 'admin', 'operator']))
      )
    )
  );
