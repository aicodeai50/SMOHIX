-- Staffing action SLA breach digest when open actions exceed days-past-peak SLA.

alter table public.organizations
  add column if not exists compliance_staffing_sla_breach_digest_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_staffing_sla_breach_email_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_staffing_sla_days_after_peak_week integer not null default 7;

comment on column public.organizations.compliance_staffing_sla_breach_digest_enabled is
  'When true, evaluate and deliver staffing action SLA breach digests.';

comment on column public.organizations.compliance_staffing_sla_breach_email_enabled is
  'When true, email owners and admins for staffing SLA breach digests.';

comment on column public.organizations.compliance_staffing_sla_days_after_peak_week is
  'Days after forecast peak week end before an open staffing action counts as an SLA breach.';

create table if not exists public.compliance_staffing_sla_breach_digest_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  period_key text not null,
  sla_days_after_peak_week integer not null default 7,
  breach_count integer not null default 0,
  max_days_past_peak integer not null default 0,
  emails_sent integer not null default 0,
  slack_sent boolean not null default false,
  delivery_status text not null default 'sent',
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_staffing_sla_breach_digest_deliveries_org_created_idx
  on public.compliance_staffing_sla_breach_digest_deliveries (org_id, created_at desc);

create unique index if not exists compliance_staffing_sla_breach_digest_deliveries_org_period_uidx
  on public.compliance_staffing_sla_breach_digest_deliveries (org_id, period_key);

alter table public.compliance_staffing_sla_breach_digest_deliveries enable row level security;

create policy "compliance_staffing_sla_breach_digest_deliveries_select_org"
  on public.compliance_staffing_sla_breach_digest_deliveries for select
  using (public.is_org_member(org_id));

create policy "compliance_staffing_sla_breach_digest_deliveries_insert_org"
  on public.compliance_staffing_sla_breach_digest_deliveries for insert
  with check (public.is_org_member(org_id));

comment on table public.compliance_staffing_sla_breach_digest_deliveries is
  'Deduped weekly staffing action SLA breach digest deliveries.';
