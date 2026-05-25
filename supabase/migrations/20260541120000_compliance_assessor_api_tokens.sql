-- Org-scoped read-only API tokens for external assessors (compliance export routes).

create table if not exists public.compliance_assessor_api_tokens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete restrict,
  name text not null default 'Assessor API token',
  key_prefix text not null,
  secret_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create unique index if not exists compliance_assessor_api_tokens_active_hash_uidx
  on public.compliance_assessor_api_tokens (secret_hash)
  where revoked_at is null;

create index if not exists compliance_assessor_api_tokens_org_created_idx
  on public.compliance_assessor_api_tokens (org_id, created_at desc);

alter table public.compliance_assessor_api_tokens enable row level security;

create policy "compliance_assessor_api_tokens_select_org"
  on public.compliance_assessor_api_tokens for select
  using (public.is_org_member(org_id));

create policy "compliance_assessor_api_tokens_insert_admin"
  on public.compliance_assessor_api_tokens for insert
  with check (
    public.has_org_role(org_id, array['owner', 'admin'])
    and created_by = auth.uid()
  );

create policy "compliance_assessor_api_tokens_update_admin"
  on public.compliance_assessor_api_tokens for update
  using (public.has_org_role(org_id, array['owner', 'admin']));

comment on table public.compliance_assessor_api_tokens is
  'Org-scoped zentro_ca_* tokens for read-only GET /api/governance/compliance/assessor/* exports.';
