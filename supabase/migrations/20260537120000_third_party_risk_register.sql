-- Third-party risk register: vendor inventory with inherited compliance controls.

create table if not exists public.third_party_vendors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  category text not null
    check (category in ('saas', 'cloud', 'security', 'data_processor', 'consulting', 'other')),
  risk_tier text not null
    check (risk_tier in ('low', 'medium', 'high', 'critical')),
  status text not null default 'active'
    check (status in ('active', 'review', 'offboarding')),
  review_due_at timestamptz,
  contact_email text,
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create index if not exists third_party_vendors_org_tier_idx
  on public.third_party_vendors (org_id, risk_tier, status);

create table if not exists public.third_party_vendor_controls (
  vendor_id uuid not null references public.third_party_vendors (id) on delete cascade,
  control_id text not null,
  source text not null default 'inherited'
    check (source in ('inherited', 'explicit')),
  primary key (vendor_id, control_id)
);

create index if not exists third_party_vendor_controls_vendor_idx
  on public.third_party_vendor_controls (vendor_id);

alter table public.third_party_vendors enable row level security;
alter table public.third_party_vendor_controls enable row level security;

create policy "third_party_vendors_select_org"
  on public.third_party_vendors for select
  using (public.is_org_member(org_id));

create policy "third_party_vendors_insert_org"
  on public.third_party_vendors for insert
  with check (
    public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin'])
    and created_by = auth.uid()
  );

create policy "third_party_vendors_update_org"
  on public.third_party_vendors for update
  using (public.has_org_role(org_id, array['owner', 'admin']));

create policy "third_party_vendor_controls_select_org"
  on public.third_party_vendor_controls for select
  using (
    exists (
      select 1 from public.third_party_vendors v
      where v.id = vendor_id and public.is_org_member(v.org_id)
    )
  );

create policy "third_party_vendor_controls_insert_org"
  on public.third_party_vendor_controls for insert
  with check (
    exists (
      select 1 from public.third_party_vendors v
      where v.id = vendor_id
        and public.has_org_role(v.org_id, array['owner', 'admin'])
    )
  );

create policy "third_party_vendor_controls_delete_org"
  on public.third_party_vendor_controls for delete
  using (
    exists (
      select 1 from public.third_party_vendors v
      where v.id = vendor_id
        and public.has_org_role(v.org_id, array['owner', 'admin'])
    )
  );

comment on table public.third_party_vendors is
  'Third-party / vendor inventory for org-scoped risk register and control inheritance.';

comment on table public.third_party_vendor_controls is
  'SOC 2 / ISO controls inherited or explicitly linked to a vendor for evidence reuse.';
