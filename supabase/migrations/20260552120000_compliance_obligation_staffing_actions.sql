-- Track accepted load-balance and capacity relief staffing actions through completion.

create table if not exists public.compliance_obligation_staffing_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  action_key text not null,
  action_type text not null
    check (action_type in ('load_balance', 'capacity_whatif')),
  title text not null,
  status text not null default 'accepted'
    check (status in ('accepted', 'in_progress', 'completed', 'dismissed')),
  peak_week_key text,
  source_detail text,
  obligation_id text,
  from_owner_label text,
  to_owner_label text,
  whatif_scenario_id text,
  assignee_user_id uuid references public.profiles (id) on delete set null,
  operator_note text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists compliance_obligation_staffing_actions_org_key_uidx
  on public.compliance_obligation_staffing_actions (org_id, action_key);

create index if not exists compliance_obligation_staffing_actions_org_status_updated_idx
  on public.compliance_obligation_staffing_actions (org_id, status, updated_at desc);

alter table public.compliance_obligation_staffing_actions enable row level security;

create policy "compliance_obligation_staffing_actions_select_org"
  on public.compliance_obligation_staffing_actions for select
  using (public.is_org_member(org_id));

create policy "compliance_obligation_staffing_actions_insert_member"
  on public.compliance_obligation_staffing_actions for insert
  with check (
    public.is_org_member(org_id)
    and created_by = auth.uid()
  );

create policy "compliance_obligation_staffing_actions_update_member"
  on public.compliance_obligation_staffing_actions for update
  using (public.is_org_member(org_id));

comment on table public.compliance_obligation_staffing_actions is
  'Tracks accepted peak-week load-balance transfers and capacity what-if relief actions.';
