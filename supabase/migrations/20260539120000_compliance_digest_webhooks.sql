-- Scheduled compliance digest webhooks: weekly program readiness deltas for GRC tools.

alter table public.organizations
  add column if not exists compliance_digest_webhook_url text;

comment on column public.organizations.compliance_digest_webhook_url is
  'Optional HTTPS endpoint to POST weekly compliance program digest payloads (readiness deltas, overdue attestations).';

create table if not exists public.compliance_digest_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  period_days integer not null default 30,
  snapshot_json jsonb not null,
  digest_json jsonb not null,
  delivery_status text not null default 'stored'
    check (delivery_status in ('stored', 'webhook_sent', 'webhook_failed', 'webhook_skipped')),
  delivery_note text,
  created_at timestamptz not null default now()
);

create index if not exists compliance_digest_deliveries_org_created_idx
  on public.compliance_digest_deliveries (org_id, created_at desc);

alter table public.compliance_digest_deliveries enable row level security;

create policy "compliance_digest_deliveries_select_org"
  on public.compliance_digest_deliveries for select
  using (public.is_org_member(org_id));

create policy "compliance_digest_deliveries_insert_org"
  on public.compliance_digest_deliveries for insert
  with check (
    public.is_org_member(org_id)
    and public.has_org_role(org_id, array['owner', 'admin'])
  );

comment on table public.compliance_digest_deliveries is
  'Compliance program digest snapshots and optional HTTPS webhook delivery log.';
