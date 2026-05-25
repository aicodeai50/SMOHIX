-- Obligation density alerting: Slack/email when weekly density exceeds org thresholds.

alter table public.organizations
  add column if not exists compliance_obligation_density_alerts_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_obligation_density_weekly_threshold integer not null default 8;

alter table public.organizations
  add column if not exists compliance_obligation_density_peak_threshold integer not null default 12;

alter table public.organizations
  add column if not exists compliance_obligation_density_overdue_threshold integer not null default 3;

alter table public.organizations
  add column if not exists compliance_obligation_density_email_enabled boolean not null default true;

alter table public.organizations
  drop constraint if exists organizations_compliance_obligation_density_weekly_threshold_check;

alter table public.organizations
  add constraint organizations_compliance_obligation_density_weekly_threshold_check
  check (compliance_obligation_density_weekly_threshold between 1 and 50);

alter table public.organizations
  drop constraint if exists organizations_compliance_obligation_density_peak_threshold_check;

alter table public.organizations
  add constraint organizations_compliance_obligation_density_peak_threshold_check
  check (compliance_obligation_density_peak_threshold between 1 and 50);

alter table public.organizations
  drop constraint if exists organizations_compliance_obligation_density_overdue_threshold_check;

alter table public.organizations
  add constraint organizations_compliance_obligation_density_overdue_threshold_check
  check (compliance_obligation_density_overdue_threshold between 0 and 30);

comment on column public.organizations.compliance_obligation_density_alerts_enabled is
  'When true, evaluate obligation density thresholds and send Slack/email alerts.';

comment on column public.organizations.compliance_obligation_density_weekly_threshold is
  'Alert when current-week obligation count meets or exceeds this value (1–50).';

comment on column public.organizations.compliance_obligation_density_peak_threshold is
  'Alert when peak forecast week obligation count meets or exceeds this value (1–50).';

comment on column public.organizations.compliance_obligation_density_overdue_threshold is
  'Alert when total overdue obligations meet or exceeds this value (0 disables).';

create table if not exists public.compliance_obligation_density_alert_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  alert_key text not null,
  alert_type text not null
    check (alert_type in ('weekly_density', 'peak_week', 'overdue_spike')),
  channel text not null check (channel in ('slack', 'email')),
  recipient text,
  metric_value integer not null default 0,
  threshold_value integer not null default 0,
  created_at timestamptz not null default now(),
  unique (org_id, alert_key, channel)
);

create index if not exists compliance_obligation_density_alert_log_org_created_idx
  on public.compliance_obligation_density_alert_log (org_id, created_at desc);

alter table public.compliance_obligation_density_alert_log enable row level security;

create policy "compliance_obligation_density_alert_log_select_org"
  on public.compliance_obligation_density_alert_log for select
  using (public.is_org_member(org_id));

comment on table public.compliance_obligation_density_alert_log is
  'Dedup log for obligation density Slack/email alerts.';
