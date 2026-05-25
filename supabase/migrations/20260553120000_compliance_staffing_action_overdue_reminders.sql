-- Staffing action overdue reminders when open actions remain past peak week.

alter table public.organizations
  add column if not exists compliance_staffing_overdue_reminders_enabled boolean not null default true;

alter table public.organizations
  add column if not exists compliance_staffing_overdue_email_enabled boolean not null default true;

comment on column public.organizations.compliance_staffing_overdue_reminders_enabled is
  'When true, send reminders for open staffing actions past the forecast peak week.';

comment on column public.organizations.compliance_staffing_overdue_email_enabled is
  'When true, email assignees and owners/admins for overdue staffing actions.';

create table if not exists public.compliance_staffing_action_reminder_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  action_id uuid not null references public.compliance_obligation_staffing_actions (id) on delete cascade,
  reminder_key text not null,
  channel text not null check (channel in ('slack', 'email')),
  recipient text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_staffing_action_reminder_log_org_created_idx
  on public.compliance_staffing_action_reminder_log (org_id, created_at desc);

create unique index if not exists compliance_staffing_action_reminder_log_org_key_channel_uidx
  on public.compliance_staffing_action_reminder_log (org_id, reminder_key, channel);

alter table public.compliance_staffing_action_reminder_log enable row level security;

create policy "compliance_staffing_action_reminder_log_select_org"
  on public.compliance_staffing_action_reminder_log for select
  using (public.is_org_member(org_id));

create policy "compliance_staffing_action_reminder_log_insert_org"
  on public.compliance_staffing_action_reminder_log for insert
  with check (public.is_org_member(org_id));

comment on table public.compliance_staffing_action_reminder_log is
  'Dedup log for staffing action overdue email and Slack reminders.';
