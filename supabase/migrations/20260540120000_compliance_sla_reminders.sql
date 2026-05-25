-- Compliance control SLA reminders: email and Slack nudges for attestations and readiness regression.

alter table public.organizations
  add column if not exists compliance_sla_reminders_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_sla_due_days_before integer not null default 7;

alter table public.organizations
  add column if not exists compliance_sla_email_enabled boolean not null default true;

alter table public.organizations
  drop constraint if exists organizations_compliance_sla_due_days_before_check;

alter table public.organizations
  add constraint organizations_compliance_sla_due_days_before_check
  check (compliance_sla_due_days_before between 1 and 30);

comment on column public.organizations.compliance_sla_reminders_enabled is
  'When true, scheduled jobs may send Slack/email SLA reminders for this org.';

comment on column public.organizations.compliance_sla_due_days_before is
  'Days before attestation due date to send approaching-due reminders (1–30).';

comment on column public.organizations.compliance_sla_email_enabled is
  'When true and Resend is configured platform-wide, email owners/admins for SLA items.';

create table if not exists public.compliance_sla_reminder_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  reminder_key text not null,
  reminder_type text not null
    check (reminder_type in ('due_soon', 'overdue', 'regressed')),
  channel text not null check (channel in ('slack', 'email')),
  recipient text,
  created_at timestamptz not null default now(),
  unique (org_id, reminder_key, channel)
);

create index if not exists compliance_sla_reminder_log_org_created_idx
  on public.compliance_sla_reminder_log (org_id, created_at desc);

alter table public.compliance_sla_reminder_log enable row level security;

create policy "compliance_sla_reminder_log_select_org"
  on public.compliance_sla_reminder_log for select
  using (public.is_org_member(org_id));

comment on table public.compliance_sla_reminder_log is
  'Dedup log for compliance SLA Slack/email reminders (one send per key per channel).';
