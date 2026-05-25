-- Evidence request SLA dashboard: at-risk threshold, auditor digest delivery.

alter table public.organizations
  add column if not exists compliance_evidence_request_sla_at_risk_days integer not null default 3;

alter table public.organizations
  add column if not exists compliance_evidence_request_sla_digest_email_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_evidence_request_sla_digest_webhook_url text;

alter table public.organizations
  drop constraint if exists organizations_compliance_evidence_request_sla_at_risk_days_check;

alter table public.organizations
  add constraint organizations_compliance_evidence_request_sla_at_risk_days_check
  check (compliance_evidence_request_sla_at_risk_days between 1 and 14);

comment on column public.organizations.compliance_evidence_request_sla_at_risk_days is
  'Days before evidence request due date to flag at-risk (1–14).';

comment on column public.organizations.compliance_evidence_request_sla_digest_email_enabled is
  'When true, deliver SLA digest emails to auditor-role members.';

comment on column public.organizations.compliance_evidence_request_sla_digest_webhook_url is
  'Optional HTTPS webhook for JSON auditor SLA digest payloads.';

create table if not exists public.compliance_evidence_request_sla_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  overdue_count integer not null default 0,
  at_risk_count integer not null default 0,
  fulfillment_rate_percent numeric(5, 2) not null default 0,
  delivery_status text not null default 'pending',
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_evidence_request_sla_deliveries_org_created_idx
  on public.compliance_evidence_request_sla_deliveries (org_id, created_at desc);

alter table public.compliance_evidence_request_sla_deliveries enable row level security;

create policy "compliance_evidence_request_sla_deliveries_select_org"
  on public.compliance_evidence_request_sla_deliveries for select
  using (public.is_org_member(org_id));

create policy "compliance_evidence_request_sla_deliveries_insert_org"
  on public.compliance_evidence_request_sla_deliveries for insert
  with check (public.is_org_member(org_id));

comment on table public.compliance_evidence_request_sla_deliveries is
  'History of evidence request SLA auditor digest deliveries.';
