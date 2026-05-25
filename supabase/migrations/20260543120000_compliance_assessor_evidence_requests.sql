-- Assessor evidence request workflow: auditors request documents; org members fulfill.

create table if not exists public.compliance_assessor_evidence_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  control_id text not null,
  title text not null,
  description text,
  document_type text not null default 'control_evidence'
    check (document_type in ('control_evidence', 'policy_document', 'audit_export', 'architecture', 'other')),
  status text not null default 'open'
    check (status in ('open', 'fulfilled', 'cancelled')),
  requested_by uuid not null references public.profiles (id) on delete restrict,
  assigned_to uuid references public.profiles (id) on delete set null,
  due_at timestamptz not null,
  fulfilled_at timestamptz,
  fulfilled_by uuid references public.profiles (id) on delete set null,
  fulfillment_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_assessor_evidence_requests_org_status_due_idx
  on public.compliance_assessor_evidence_requests (org_id, status, due_at);

create index if not exists compliance_assessor_evidence_requests_org_control_idx
  on public.compliance_assessor_evidence_requests (org_id, control_id);

alter table public.compliance_assessor_evidence_requests enable row level security;

create policy "compliance_assessor_evidence_requests_select_org"
  on public.compliance_assessor_evidence_requests for select
  using (public.is_org_member(org_id));

create policy "compliance_assessor_evidence_requests_insert_assessor"
  on public.compliance_assessor_evidence_requests for insert
  with check (
    public.is_org_member(org_id)
    and requested_by = auth.uid()
    and public.has_org_role(org_id, array['auditor', 'owner', 'admin'])
  );

create policy "compliance_assessor_evidence_requests_update_org"
  on public.compliance_assessor_evidence_requests for update
  using (public.is_org_member(org_id));

comment on table public.compliance_assessor_evidence_requests is
  'Assessor-originated evidence document requests with due dates and control linkage.';
