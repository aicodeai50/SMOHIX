-- Contact leads from smohix.run public contact form.
-- Inserts/updates via service role only (Next.js API routes).

create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text not null,
  country text not null,
  inquiry_type text not null,
  problem_summary text not null,
  budget_range text,
  timeline text,
  product_context text,
  pilot_category text,
  consent boolean not null default true,
  source_path text,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'contacted', 'qualified', 'closed', 'spam')),
  assigned_to text,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists contact_leads_created_at_idx
  on public.contact_leads (created_at desc);

create index if not exists contact_leads_inquiry_type_idx
  on public.contact_leads (inquiry_type, created_at desc);

create index if not exists contact_leads_status_idx
  on public.contact_leads (status, created_at desc);

create index if not exists contact_leads_email_idx
  on public.contact_leads (lower(email), created_at desc);

create or replace function public.contact_leads_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contact_leads_updated_at on public.contact_leads;
create trigger contact_leads_updated_at
  before update on public.contact_leads
  for each row execute function public.contact_leads_set_updated_at();

alter table public.contact_leads enable row level security;

-- No policies for anon/authenticated: service role bypasses RLS for API routes.

comment on table public.contact_leads is
  'Marketing and pilot leads from smohix.run — server-only access via service role.';
