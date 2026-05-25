-- Cross-staffing committee escalation after completion rollup + SLA breaches remain open.

alter table public.organizations
  add column if not exists compliance_cross_staffing_escalation_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_cross_staffing_escalation_email_enabled boolean not null default true;

comment on column public.organizations.compliance_cross_staffing_escalation_enabled is
  'When true, evaluate and deliver cross-staffing committee escalations after rollup email.';

comment on column public.organizations.compliance_cross_staffing_escalation_email_enabled is
  'When true, email admins for cross-staffing committee escalations.';

create table if not exists public.compliance_cross_staffing_committee_escalation_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  period_key text not null,
  rollup_delivery_id uuid references public.compliance_staffing_completion_rollup_deliveries (id) on delete set null,
  rollup_open_count integer not null default 0,
  sla_days_after_peak_week integer not null default 7,
  breach_count integer not null default 0,
  max_days_past_peak integer not null default 0,
  emails_sent integer not null default 0,
  slack_sent boolean not null default false,
  delivery_status text not null default 'sent',
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_cross_staffing_escalation_deliveries_org_created_idx
  on public.compliance_cross_staffing_committee_escalation_deliveries (org_id, created_at desc);

create unique index if not exists compliance_cross_staffing_escalation_deliveries_org_period_uidx
  on public.compliance_cross_staffing_committee_escalation_deliveries (org_id, period_key);

alter table public.compliance_cross_staffing_committee_escalation_deliveries enable row level security;

create policy "compliance_cross_staffing_escalation_deliveries_select_org"
  on public.compliance_cross_staffing_committee_escalation_deliveries for select
  using (public.is_org_member(org_id));

create policy "compliance_cross_staffing_escalation_deliveries_insert_org"
  on public.compliance_cross_staffing_committee_escalation_deliveries for insert
  with check (public.is_org_member(org_id));

comment on table public.compliance_cross_staffing_committee_escalation_deliveries is
  'Deduped weekly cross-staffing committee escalations after completion rollup email.';
