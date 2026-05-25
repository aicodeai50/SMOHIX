-- Org-scoped compliance gap → runbook/playbook remediation tracking.

create table if not exists public.compliance_gap_remediations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  gap_key text not null,
  framework text not null,
  control_ref text not null,
  title text not null,
  reason text not null,
  runbook_slug text not null,
  playbook_id text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'dismissed')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists compliance_gap_remediations_org_gap_key_uidx
  on public.compliance_gap_remediations (org_id, gap_key);

create index if not exists compliance_gap_remediations_org_status_updated_idx
  on public.compliance_gap_remediations (org_id, status, updated_at desc);

alter table public.compliance_gap_remediations enable row level security;

create policy "compliance_gap_remediations_select_org"
  on public.compliance_gap_remediations for select
  using (public.is_org_member(org_id));

create policy "compliance_gap_remediations_insert_member"
  on public.compliance_gap_remediations for insert
  with check (
    public.is_org_member(org_id)
    and created_by = auth.uid()
  );

create policy "compliance_gap_remediations_update_member"
  on public.compliance_gap_remediations for update
  using (public.is_org_member(org_id));

comment on table public.compliance_gap_remediations is
  'Tracks framework assessment gaps linked to runbook/playbook remediation until resolved.';
