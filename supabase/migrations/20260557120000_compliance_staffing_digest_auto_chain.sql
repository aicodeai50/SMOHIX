-- Staffing digest auto-chain — single UTC-week run: rollup → SLA digest → committee escalation.

alter table public.organizations
  add column if not exists compliance_staffing_digest_auto_chain_enabled boolean not null default true;

comment on column public.organizations.compliance_staffing_digest_auto_chain_enabled is
  'When true, allow scheduled auto-chain of staffing completion rollup, SLA breach digest, and committee escalation.';

create table if not exists public.compliance_staffing_digest_auto_chain_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  period_key text not null,
  rollup_status text not null default 'skipped',
  rollup_reason text,
  sla_status text not null default 'skipped',
  sla_reason text,
  escalation_status text not null default 'skipped',
  escalation_reason text,
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_staffing_digest_auto_chain_runs_org_created_idx
  on public.compliance_staffing_digest_auto_chain_runs (org_id, created_at desc);

create unique index if not exists compliance_staffing_digest_auto_chain_runs_org_period_uidx
  on public.compliance_staffing_digest_auto_chain_runs (org_id, period_key);

alter table public.compliance_staffing_digest_auto_chain_runs enable row level security;

create policy "compliance_staffing_digest_auto_chain_runs_select_org"
  on public.compliance_staffing_digest_auto_chain_runs for select
  using (public.is_org_member(org_id));

create policy "compliance_staffing_digest_auto_chain_runs_insert_org"
  on public.compliance_staffing_digest_auto_chain_runs for insert
  with check (public.is_org_member(org_id));

comment on table public.compliance_staffing_digest_auto_chain_runs is
  'Deduped weekly staffing digest auto-chain runs (rollup → SLA digest → escalation).';
