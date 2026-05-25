-- Attestation renewal calendar: owner nudge dedup for renewal waves.

alter table public.organizations
  add column if not exists compliance_attestation_renewal_nudges_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_attestation_renewal_horizon_days integer not null default 90;

alter table public.organizations
  drop constraint if exists organizations_compliance_attestation_renewal_horizon_days_check;

alter table public.organizations
  add constraint organizations_compliance_attestation_renewal_horizon_days_check
  check (compliance_attestation_renewal_horizon_days between 14 and 365);

comment on column public.organizations.compliance_attestation_renewal_nudges_enabled is
  'When true, admins and cron may email control owners for attestation renewal waves.';

comment on column public.organizations.compliance_attestation_renewal_horizon_days is
  'Days ahead to include attestation renewals on the calendar (14–365).';

create table if not exists public.compliance_attestation_renewal_nudge_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  nudge_key text not null,
  nudge_type text not null check (nudge_type in ('owner_wave', 'owner_bulk')),
  channel text not null check (channel in ('email')),
  recipient text,
  created_at timestamptz not null default now(),
  unique (org_id, nudge_key, channel)
);

create index if not exists compliance_attestation_renewal_nudge_log_org_created_idx
  on public.compliance_attestation_renewal_nudge_log (org_id, created_at desc);

alter table public.compliance_attestation_renewal_nudge_log enable row level security;

create policy "compliance_attestation_renewal_nudge_log_select_org"
  on public.compliance_attestation_renewal_nudge_log for select
  using (public.is_org_member(org_id));

comment on table public.compliance_attestation_renewal_nudge_log is
  'Dedup log for attestation renewal owner email nudges (one send per key per channel).';
