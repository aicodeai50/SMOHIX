-- Peak-week staffing digest: email/Slack when capacity shortfall and load imbalance coincide.

alter table public.organizations
  add column if not exists compliance_peak_week_staffing_digest_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_peak_week_staffing_email_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_peak_week_staffing_webhook_url text;

comment on column public.organizations.compliance_peak_week_staffing_digest_enabled is
  'When true, evaluate peak-week capacity shortfall + load imbalance for staffing digest.';

comment on column public.organizations.compliance_peak_week_staffing_email_enabled is
  'When true, email owners/admins the peak-week staffing digest.';

comment on column public.organizations.compliance_peak_week_staffing_webhook_url is
  'Optional HTTPS webhook for peak-week staffing digest JSON payloads.';

create table if not exists public.compliance_peak_week_staffing_digest_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  peak_week_key text,
  shortfall_hours numeric(8,1) not null default 0,
  imbalance_score integer not null default 0,
  suggestion_count integer not null default 0,
  delivery_status text not null default 'delivered',
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_peak_week_staffing_digest_deliveries_org_created_idx
  on public.compliance_peak_week_staffing_digest_deliveries (org_id, created_at desc);

create unique index if not exists compliance_peak_week_staffing_digest_deliveries_org_week_idx
  on public.compliance_peak_week_staffing_digest_deliveries (org_id, peak_week_key)
  where peak_week_key is not null;

alter table public.compliance_peak_week_staffing_digest_deliveries enable row level security;

create policy "compliance_peak_week_staffing_digest_deliveries_select_org"
  on public.compliance_peak_week_staffing_digest_deliveries for select
  using (org_id in (select public.user_org_ids()));

create policy "compliance_peak_week_staffing_digest_deliveries_insert_org"
  on public.compliance_peak_week_staffing_digest_deliveries for insert
  with check (org_id in (select public.user_org_ids()));

comment on table public.compliance_peak_week_staffing_digest_deliveries is
  'Peak-week staffing digest deliveries when capacity and load imbalance coincide.';
