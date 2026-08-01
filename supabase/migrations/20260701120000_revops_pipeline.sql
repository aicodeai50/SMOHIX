-- Revenue operations: lead pipeline extensions, activity history, pilot projects.

-- Extend contact_leads status and ops fields
alter table public.contact_leads drop constraint if exists contact_leads_status_check;

alter table public.contact_leads
  add column if not exists next_action text,
  add column if not exists follow_up_date timestamptz,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists source_label text,
  add column if not exists discovery_call_date timestamptz,
  add column if not exists pilot_kickoff_date timestamptz,
  add column if not exists review_meeting_date timestamptz,
  add column if not exists pilot_project_id uuid;

alter table public.contact_leads
  add constraint contact_leads_status_check
  check (status in (
    'new', 'reviewing', 'contacted', 'qualified',
    'pilot_proposed', 'pilot_active', 'won', 'closed', 'spam'
  ));

create index if not exists contact_leads_follow_up_date_idx
  on public.contact_leads (follow_up_date asc nulls last)
  where follow_up_date is not null;

create index if not exists contact_leads_priority_idx
  on public.contact_leads (priority, created_at desc);

create index if not exists contact_leads_assigned_to_idx
  on public.contact_leads (assigned_to, status);

-- Append-only lead activity
create table if not exists public.lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.contact_leads (id) on delete cascade,
  created_at timestamptz not null default now(),
  actor_email text not null,
  event_type text not null check (event_type in (
    'lead_created', 'status_changed', 'assigned', 'note_added',
    'follow_up_scheduled', 'contact_attempted', 'pilot_proposed',
    'pilot_started', 'lead_won', 'lead_closed', 'priority_changed',
    'next_action_set', 'email_drafted', 'email_sent'
  )),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists lead_activity_lead_id_idx
  on public.lead_activity (lead_id, created_at desc);

create index if not exists lead_activity_created_at_idx
  on public.lead_activity (created_at desc);

alter table public.lead_activity enable row level security;

-- Pilot projects
create table if not exists public.pilot_projects (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  lead_id uuid references public.contact_leads (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  organization text not null,
  contact_name text not null,
  contact_email text not null,
  category text,
  related_product text,
  objective text,
  scope text,
  status text not null default 'draft'
    check (status in ('draft', 'proposed', 'approved', 'active', 'paused', 'completed', 'cancelled')),
  start_date date,
  target_review_date date,
  owner text,
  risks text,
  next_action text,
  notes text,
  discovery_call_date timestamptz,
  pilot_kickoff_date timestamptz,
  review_meeting_date timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.contact_leads
  add constraint contact_leads_pilot_project_id_fkey
  foreign key (pilot_project_id) references public.pilot_projects (id) on delete set null;

create index if not exists pilot_projects_status_idx
  on public.pilot_projects (status, created_at desc);

create index if not exists pilot_projects_lead_id_idx
  on public.pilot_projects (lead_id);

create index if not exists pilot_projects_owner_idx
  on public.pilot_projects (owner, status);

create or replace function public.pilot_projects_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pilot_projects_updated_at on public.pilot_projects;
create trigger pilot_projects_updated_at
  before update on public.pilot_projects
  for each row execute function public.pilot_projects_set_updated_at();

alter table public.pilot_projects enable row level security;

-- Append-only pilot activity
create table if not exists public.pilot_activity (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references public.pilot_projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  actor_email text not null,
  event_type text not null check (event_type in (
    'pilot_created', 'status_changed', 'assigned', 'note_added',
    'follow_up_scheduled', 'proposal_generated', 'proposal_sent',
    'pilot_started', 'pilot_completed', 'pilot_cancelled'
  )),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists pilot_activity_pilot_id_idx
  on public.pilot_activity (pilot_id, created_at desc);

alter table public.pilot_activity enable row level security;

comment on table public.lead_activity is 'Append-only lead ops history — service role only.';
comment on table public.pilot_projects is 'Pilot engagements originating from qualified leads.';
comment on table public.pilot_activity is 'Append-only pilot ops history — service role only.';
