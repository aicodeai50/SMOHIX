-- Control attestation workflows: owner assignment, due dates, sign-off trail.

create table if not exists public.compliance_control_attestations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  control_id text not null,
  owner_user_id uuid references public.profiles (id) on delete set null,
  due_at timestamptz not null,
  attested_at timestamptz,
  attested_by uuid references public.profiles (id) on delete set null,
  attestation_note text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, control_id)
);

create index if not exists compliance_control_attestations_org_due_idx
  on public.compliance_control_attestations (org_id, due_at);

create table if not exists public.compliance_control_attestation_events (
  id uuid primary key default gen_random_uuid(),
  attestation_id uuid not null references public.compliance_control_attestations (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  event_type text not null
    check (event_type in ('owner_assigned', 'due_updated', 'attested', 'note')),
  actor_user_id uuid not null references public.profiles (id) on delete restrict,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists compliance_control_attestation_events_attestation_idx
  on public.compliance_control_attestation_events (attestation_id, created_at desc);

alter table public.compliance_control_attestations enable row level security;
alter table public.compliance_control_attestation_events enable row level security;

create policy "compliance_control_attestations_select_org"
  on public.compliance_control_attestations for select
  using (public.is_org_member(org_id));

create policy "compliance_control_attestations_insert_org"
  on public.compliance_control_attestations for insert
  with check (
    public.is_org_member(org_id)
    and created_by = auth.uid()
  );

create policy "compliance_control_attestations_update_org"
  on public.compliance_control_attestations for update
  using (
    public.is_org_member(org_id)
    and (
      public.has_org_role(org_id, array['owner', 'admin'])
      or owner_user_id = auth.uid()
    )
  );

create policy "compliance_control_attestation_events_select_org"
  on public.compliance_control_attestation_events for select
  using (public.is_org_member(org_id));

create policy "compliance_control_attestation_events_insert_org"
  on public.compliance_control_attestation_events for insert
  with check (
    public.is_org_member(org_id)
    and actor_user_id = auth.uid()
  );

comment on table public.compliance_control_attestations is
  'Per-control owner, due date, and sign-off for SOC 2 / ISO 27001 attestation workflows.';

comment on table public.compliance_control_attestation_events is
  'Append-only sign-off trail for control attestation changes.';
