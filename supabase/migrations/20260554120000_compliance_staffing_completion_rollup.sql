-- Staffing completion rollup — printable archive and optional scheduled email.

alter table public.organizations
  add column if not exists compliance_staffing_completion_rollup_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_staffing_completion_rollup_email_enabled boolean not null default true;

comment on column public.organizations.compliance_staffing_completion_rollup_enabled is
  'When true, allow staffing completion rollup export and scheduled delivery.';

comment on column public.organizations.compliance_staffing_completion_rollup_email_enabled is
  'When true, email owners and admins the weekly staffing completion rollup.';

create table if not exists public.compliance_staffing_completion_rollup_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  period_key text not null,
  tracked_count integer not null default 0,
  completed_count integer not null default 0,
  open_count integer not null default 0,
  completion_percent integer not null default 0,
  emails_sent integer not null default 0,
  delivery_status text not null default 'sent',
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_staffing_completion_rollup_deliveries_org_created_idx
  on public.compliance_staffing_completion_rollup_deliveries (org_id, created_at desc);

create unique index if not exists compliance_staffing_completion_rollup_deliveries_org_period_uidx
  on public.compliance_staffing_completion_rollup_deliveries (org_id, period_key);

alter table public.compliance_staffing_completion_rollup_deliveries enable row level security;

create policy "compliance_staffing_completion_rollup_deliveries_select_org"
  on public.compliance_staffing_completion_rollup_deliveries for select
  using (public.is_org_member(org_id));

create policy "compliance_staffing_completion_rollup_deliveries_insert_org"
  on public.compliance_staffing_completion_rollup_deliveries for insert
  with check (public.is_org_member(org_id));

comment on table public.compliance_staffing_completion_rollup_deliveries is
  'Deduped weekly staffing completion rollup deliveries to committee admins.';
