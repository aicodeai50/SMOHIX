-- Service catalog + alert ingest tokens + incident extensions.
-- Apply after platform_spine and incidents migrations.

-- ---------------------------------------------------------------------------
-- services (IT service / system catalog per user)
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  environment text,
  owner_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_user_updated_idx
  on public.services (user_id, updated_at desc);

alter table public.services enable row level security;

create policy "services_select_own"
  on public.services for select
  using (auth.uid() = user_id);

create policy "services_insert_own"
  on public.services for insert
  with check (auth.uid() = user_id);

create policy "services_update_own"
  on public.services for update
  using (auth.uid() = user_id);

create policy "services_delete_own"
  on public.services for delete
  using (auth.uid() = user_id);

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row
  execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- alert_ingest_tokens (hashed secrets; verified via service role on webhook)
-- ---------------------------------------------------------------------------
create table if not exists public.alert_ingest_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Alert ingest',
  key_prefix text not null,
  secret_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create unique index if not exists alert_ingest_tokens_active_secret_hash_uidx
  on public.alert_ingest_tokens (secret_hash)
  where revoked_at is null;

create index if not exists alert_ingest_tokens_user_created_idx
  on public.alert_ingest_tokens (user_id, created_at desc);

alter table public.alert_ingest_tokens enable row level security;

create policy "alert_ingest_tokens_select_own"
  on public.alert_ingest_tokens for select
  using (auth.uid() = user_id);

create policy "alert_ingest_tokens_insert_own"
  on public.alert_ingest_tokens for insert
  with check (auth.uid() = user_id);

create policy "alert_ingest_tokens_update_own"
  on public.alert_ingest_tokens for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- incidents: optional service link, postmortem, external dedupe ref
-- ---------------------------------------------------------------------------
alter table public.incidents
  add column if not exists service_id uuid references public.services (id) on delete set null;

alter table public.incidents
  add column if not exists postmortem text;

alter table public.incidents
  add column if not exists external_ref text;

create unique index if not exists incidents_user_external_ref_uidx
  on public.incidents (user_id, external_ref)
  where external_ref is not null and length(trim(external_ref)) > 0;

create index if not exists incidents_service_idx
  on public.incidents (user_id, service_id)
  where service_id is not null;
