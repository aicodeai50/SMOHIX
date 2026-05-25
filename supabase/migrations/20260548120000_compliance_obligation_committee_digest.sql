-- Quarterly obligation committee digest: email + webhook for owners/admins.

alter table public.organizations
  add column if not exists compliance_committee_digest_email_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_committee_digest_webhook_url text;

comment on column public.organizations.compliance_committee_digest_email_enabled is
  'When true, deliver quarterly obligation committee digest emails to owners and admins.';

comment on column public.organizations.compliance_committee_digest_webhook_url is
  'Optional HTTPS webhook for JSON quarterly obligation committee digest payloads.';

create table if not exists public.compliance_obligation_committee_digest_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  peak_week_key text,
  peak_week_count integer not null default 0,
  crossover_cluster_count integer not null default 0,
  sla_overdue_count integer not null default 0,
  sla_at_risk_count integer not null default 0,
  delivery_status text not null default 'pending',
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_obligation_committee_digest_deliveries_org_created_idx
  on public.compliance_obligation_committee_digest_deliveries (org_id, created_at desc);

alter table public.compliance_obligation_committee_digest_deliveries enable row level security;

create policy "compliance_obligation_committee_digest_deliveries_select_org"
  on public.compliance_obligation_committee_digest_deliveries for select
  using (public.is_org_member(org_id));

create policy "compliance_obligation_committee_digest_deliveries_insert_org"
  on public.compliance_obligation_committee_digest_deliveries for insert
  with check (public.is_org_member(org_id));

comment on table public.compliance_obligation_committee_digest_deliveries is
  'History of quarterly obligation committee digest deliveries.';
