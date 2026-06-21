-- Enterprise readiness foundations: org billing, SSO placeholders, org-scoped tokens,
-- org-scoped Copilot memory, and first-party integration connection records.

alter table public.subscriptions
  add column if not exists org_id uuid references public.organizations (id) on delete cascade,
  add column if not exists seat_limit integer not null default 1 check (seat_limit > 0),
  add column if not exists billing_scope text not null default 'user' check (billing_scope in ('user', 'org'));

create index if not exists subscriptions_org_updated_idx
  on public.subscriptions (org_id, updated_at desc)
  where org_id is not null;

create policy "subscriptions_select_org"
  on public.subscriptions for select
  using (org_id is not null and public.is_org_member(org_id));

create table if not exists public.organization_sso_configs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations (id) on delete cascade,
  provider text not null default 'saml',
  domain text,
  status text not null default 'planned' check (status in ('planned', 'configured', 'disabled')),
  metadata_url text,
  entity_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_sso_configs enable row level security;

create policy "organization_sso_configs_select_member"
  on public.organization_sso_configs for select
  using (public.is_org_member(org_id));

create policy "organization_sso_configs_manage_admin"
  on public.organization_sso_configs for all
  using (public.has_org_role(org_id, array['owner', 'admin']))
  with check (public.has_org_role(org_id, array['owner', 'admin']));

drop trigger if exists organization_sso_configs_set_updated_at on public.organization_sso_configs;
create trigger organization_sso_configs_set_updated_at
  before update on public.organization_sso_configs
  for each row
  execute procedure public.set_updated_at();

alter table public.api_keys
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

create index if not exists api_keys_org_created_idx
  on public.api_keys (org_id, created_at desc)
  where org_id is not null;

create policy "api_keys_select_org"
  on public.api_keys for select
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin', 'operator']));

create policy "api_keys_insert_org"
  on public.api_keys for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "api_keys_update_org"
  on public.api_keys for update
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']))
  with check (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']));

alter table public.alert_ingest_tokens
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

create index if not exists alert_ingest_tokens_org_created_idx
  on public.alert_ingest_tokens (org_id, created_at desc)
  where org_id is not null;

create policy "alert_ingest_tokens_select_org"
  on public.alert_ingest_tokens for select
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin', 'operator']));

create policy "alert_ingest_tokens_insert_org"
  on public.alert_ingest_tokens for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.has_org_role(org_id, array['owner', 'admin', 'operator'])
  );

create policy "alert_ingest_tokens_update_org"
  on public.alert_ingest_tokens for update
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']))
  with check (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']));

alter table public.copilot_threads
  add column if not exists org_id uuid references public.organizations (id) on delete cascade,
  add column if not exists incident_id uuid references public.incidents (id) on delete set null;

create index if not exists copilot_threads_org_updated_idx
  on public.copilot_threads (org_id, updated_at desc)
  where org_id is not null;

create policy "copilot_threads_select_org"
  on public.copilot_threads for select
  using (org_id is not null and public.is_org_member(org_id));

create policy "copilot_threads_insert_org"
  on public.copilot_threads for insert
  with check (
    org_id is not null
    and user_id = auth.uid()
    and public.is_org_member(org_id)
  );

create policy "copilot_threads_update_org"
  on public.copilot_threads for update
  using (org_id is not null and public.is_org_member(org_id))
  with check (org_id is not null and public.is_org_member(org_id));

create policy "copilot_threads_delete_org"
  on public.copilot_threads for delete
  using (org_id is not null and public.has_org_role(org_id, array['owner', 'admin']));

create policy "copilot_messages_select_via_org_thread"
  on public.copilot_messages for select
  using (
    exists (
      select 1 from public.copilot_threads t
      where t.id = copilot_messages.thread_id
      and t.org_id is not null
      and public.is_org_member(t.org_id)
    )
  );

create policy "copilot_messages_insert_via_org_thread"
  on public.copilot_messages for insert
  with check (
    exists (
      select 1 from public.copilot_threads t
      where t.id = copilot_messages.thread_id
      and t.org_id is not null
      and public.is_org_member(t.org_id)
    )
  );

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('slack', 'pagerduty', 'jira', 'servicenow', 'github', 'datadog', 'prometheus')),
  status text not null default 'planned' check (status in ('planned', 'configured', 'degraded', 'disabled')),
  display_name text not null,
  config jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, provider, display_name)
);

create index if not exists integration_connections_org_provider_idx
  on public.integration_connections (org_id, provider, status);

alter table public.integration_connections enable row level security;

create policy "integration_connections_select_member"
  on public.integration_connections for select
  using (public.is_org_member(org_id));

create policy "integration_connections_manage_operator"
  on public.integration_connections for all
  using (public.has_org_role(org_id, array['owner', 'admin', 'operator']))
  with check (public.has_org_role(org_id, array['owner', 'admin', 'operator']));

drop trigger if exists integration_connections_set_updated_at on public.integration_connections;
create trigger integration_connections_set_updated_at
  before update on public.integration_connections
  for each row
  execute procedure public.set_updated_at();
