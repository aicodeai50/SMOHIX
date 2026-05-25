-- Org-scoped obligation consolidation plays (crossover cluster → single evidence workflow).

create table if not exists public.compliance_obligation_consolidation_plays (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  cluster_key text not null,
  cluster_id text not null,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'collected', 'verified', 'dismissed')),
  runbook_slug text not null default 'grc-evidence-sprint',
  playbook_id text,
  frameworks text[] not null default '{}',
  obligation_count int not null default 0,
  overdue_count int not null default 0,
  window_start timestamptz,
  window_end timestamptz,
  evidence_note text,
  operator_note text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists compliance_obligation_consolidation_plays_org_cluster_uidx
  on public.compliance_obligation_consolidation_plays (org_id, cluster_key);

create index if not exists compliance_obligation_consolidation_plays_org_status_updated_idx
  on public.compliance_obligation_consolidation_plays (org_id, status, updated_at desc);

alter table public.compliance_obligation_consolidation_plays enable row level security;

create policy "compliance_obligation_consolidation_plays_select_org"
  on public.compliance_obligation_consolidation_plays for select
  using (public.is_org_member(org_id));

create policy "compliance_obligation_consolidation_plays_insert_member"
  on public.compliance_obligation_consolidation_plays for insert
  with check (
    public.is_org_member(org_id)
    and created_by = auth.uid()
  );

create policy "compliance_obligation_consolidation_plays_update_member"
  on public.compliance_obligation_consolidation_plays for update
  using (public.is_org_member(org_id));

comment on table public.compliance_obligation_consolidation_plays is
  'Tracks operator consolidation workflow for multi-framework obligation crossover clusters.';
