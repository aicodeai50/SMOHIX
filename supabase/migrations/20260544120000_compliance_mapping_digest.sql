-- Regulatory mapping change digest: webhook/email when catalog or crosswalk mappings change.

alter table public.organizations
  add column if not exists compliance_mapping_digest_webhook_url text;

alter table public.organizations
  add column if not exists compliance_mapping_digest_email_enabled boolean not null default false;

comment on column public.organizations.compliance_mapping_digest_webhook_url is
  'Optional HTTPS endpoint for regulatory mapping change digest payloads.';

comment on column public.organizations.compliance_mapping_digest_email_enabled is
  'When true, email org owners/admins when catalog or cross-framework mappings change.';

create table if not exists public.compliance_mapping_digest_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  snapshot_json jsonb not null,
  digest_json jsonb not null,
  change_count integer not null default 0,
  delivery_status text not null default 'stored'
    check (delivery_status in ('stored', 'no_changes', 'webhook_sent', 'webhook_failed', 'webhook_skipped', 'email_sent', 'email_failed')),
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_mapping_digest_deliveries_org_created_idx
  on public.compliance_mapping_digest_deliveries (org_id, created_at desc);

alter table public.compliance_mapping_digest_deliveries enable row level security;

create policy "compliance_mapping_digest_deliveries_select_org"
  on public.compliance_mapping_digest_deliveries for select
  using (public.is_org_member(org_id));

create policy "compliance_mapping_digest_deliveries_insert_org"
  on public.compliance_mapping_digest_deliveries for insert
  with check (
    public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin'])
  );

comment on table public.compliance_mapping_digest_deliveries is
  'Snapshots of compliance catalog/crosswalk fingerprints and mapping change digest deliveries.';
