-- Assessor evidence bundles: persisted compliance packs with tamper-evident manifests.

alter table public.organizations
  add column if not exists evidence_bundle_webhook_url text;

comment on column public.organizations.evidence_bundle_webhook_url is
  'Optional HTTPS endpoint to POST new evidence bundle manifests (Enterprise assessor delivery).';

create table if not exists public.compliance_evidence_bundles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  window_label text not null,
  since_iso timestamptz,
  manifest_sha256 text not null,
  manifest_json jsonb not null,
  pack_json jsonb not null,
  storage_uri text not null,
  delivery_status text not null default 'stored'
    check (delivery_status in ('stored', 'webhook_sent', 'webhook_failed', 'webhook_skipped')),
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_evidence_bundles_org_created_idx
  on public.compliance_evidence_bundles (org_id, created_at desc);

alter table public.compliance_evidence_bundles enable row level security;

create policy "compliance_evidence_bundles_select_org"
  on public.compliance_evidence_bundles for select
  using (public.is_org_member(org_id));

create policy "compliance_evidence_bundles_insert_org"
  on public.compliance_evidence_bundles for insert
  with check (
    public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin'])
    and created_by = auth.uid()
  );
