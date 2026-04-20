-- Equipment operations: certificates/secrets, backups, network drift, access posture, and change calendar.
-- Apply after platform_spine, incidents, console_extensions, and services migrations.

-- ---------------------------------------------------------------------------
-- Certificates + secrets inventory
-- ---------------------------------------------------------------------------
create table if not exists public.asset_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  environment text,
  cn text,
  sans text[] not null default '{}',
  issuer text,
  expires_at timestamptz,
  auto_renew boolean not null default false,
  owner_hint text,
  service_id uuid references public.services (id) on delete set null,
  incident_id uuid references public.incidents (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_certificates_user_updated_idx
  on public.asset_certificates (user_id, updated_at desc);

create index if not exists asset_certificates_user_expires_idx
  on public.asset_certificates (user_id, expires_at asc nulls last);

alter table public.asset_certificates enable row level security;

create policy "asset_certificates_select_own"
  on public.asset_certificates for select
  using (auth.uid() = user_id);

create policy "asset_certificates_insert_own"
  on public.asset_certificates for insert
  with check (auth.uid() = user_id);

create policy "asset_certificates_update_own"
  on public.asset_certificates for update
  using (auth.uid() = user_id);

create policy "asset_certificates_delete_own"
  on public.asset_certificates for delete
  using (auth.uid() = user_id);

drop trigger if exists asset_certificates_set_updated_at on public.asset_certificates;
create trigger asset_certificates_set_updated_at
  before update on public.asset_certificates
  for each row
  execute procedure public.set_updated_at();

create table if not exists public.asset_secrets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  environment text,
  secret_type text not null default 'api_key'
    check (secret_type in ('api_key', 'token', 'password', 'cert_key')),
  rotation_policy_days integer not null default 90 check (rotation_policy_days > 0),
  last_rotated_at timestamptz,
  next_rotate_at timestamptz,
  owner_hint text,
  service_id uuid references public.services (id) on delete set null,
  incident_id uuid references public.incidents (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_secrets_user_updated_idx
  on public.asset_secrets (user_id, updated_at desc);

create index if not exists asset_secrets_user_rotate_idx
  on public.asset_secrets (user_id, next_rotate_at asc nulls last);

alter table public.asset_secrets enable row level security;

create policy "asset_secrets_select_own"
  on public.asset_secrets for select
  using (auth.uid() = user_id);

create policy "asset_secrets_insert_own"
  on public.asset_secrets for insert
  with check (auth.uid() = user_id);

create policy "asset_secrets_update_own"
  on public.asset_secrets for update
  using (auth.uid() = user_id);

create policy "asset_secrets_delete_own"
  on public.asset_secrets for delete
  using (auth.uid() = user_id);

drop trigger if exists asset_secrets_set_updated_at on public.asset_secrets;
create trigger asset_secrets_set_updated_at
  before update on public.asset_secrets
  for each row
  execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Backup + restore readiness
-- ---------------------------------------------------------------------------
create table if not exists public.backup_policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  asset_scope text,
  rpo_target_minutes integer check (rpo_target_minutes is null or rpo_target_minutes >= 0),
  rto_target_minutes integer check (rto_target_minutes is null or rto_target_minutes >= 0),
  retention_days integer check (retention_days is null or retention_days >= 0),
  enabled boolean not null default true,
  owner_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists backup_policies_user_updated_idx
  on public.backup_policies (user_id, updated_at desc);

alter table public.backup_policies enable row level security;

create policy "backup_policies_select_own"
  on public.backup_policies for select
  using (auth.uid() = user_id);

create policy "backup_policies_insert_own"
  on public.backup_policies for insert
  with check (auth.uid() = user_id);

create policy "backup_policies_update_own"
  on public.backup_policies for update
  using (auth.uid() = user_id);

create policy "backup_policies_delete_own"
  on public.backup_policies for delete
  using (auth.uid() = user_id);

drop trigger if exists backup_policies_set_updated_at on public.backup_policies;
create trigger backup_policies_set_updated_at
  before update on public.backup_policies
  for each row
  execute procedure public.set_updated_at();

create table if not exists public.backup_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  policy_id uuid not null references public.backup_policies (id) on delete cascade,
  status text not null check (status in ('success', 'failed', 'partial')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  snapshot_ref text,
  error_summary text,
  incident_id uuid references public.incidents (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists backup_runs_user_created_idx
  on public.backup_runs (user_id, created_at desc);

create index if not exists backup_runs_policy_created_idx
  on public.backup_runs (policy_id, created_at desc);

alter table public.backup_runs enable row level security;

create policy "backup_runs_select_own"
  on public.backup_runs for select
  using (auth.uid() = user_id);

create policy "backup_runs_insert_own"
  on public.backup_runs for insert
  with check (auth.uid() = user_id);

create policy "backup_runs_update_own"
  on public.backup_runs for update
  using (auth.uid() = user_id);

create table if not exists public.restore_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  policy_id uuid not null references public.backup_policies (id) on delete cascade,
  status text not null check (status in ('passed', 'failed')),
  tested_at timestamptz not null default now(),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  notes text,
  incident_id uuid references public.incidents (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists restore_tests_user_created_idx
  on public.restore_tests (user_id, created_at desc);

create index if not exists restore_tests_policy_tested_idx
  on public.restore_tests (policy_id, tested_at desc);

alter table public.restore_tests enable row level security;

create policy "restore_tests_select_own"
  on public.restore_tests for select
  using (auth.uid() = user_id);

create policy "restore_tests_insert_own"
  on public.restore_tests for insert
  with check (auth.uid() = user_id);

create policy "restore_tests_update_own"
  on public.restore_tests for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Network firmware + drift
-- ---------------------------------------------------------------------------
create table if not exists public.network_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  hostname text not null,
  device_role text,
  vendor text,
  model text,
  serial_number text,
  mgmt_ip text,
  site text,
  environment text,
  firmware_version text,
  owner_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists network_devices_user_updated_idx
  on public.network_devices (user_id, updated_at desc);

alter table public.network_devices enable row level security;

create policy "network_devices_select_own"
  on public.network_devices for select
  using (auth.uid() = user_id);

create policy "network_devices_insert_own"
  on public.network_devices for insert
  with check (auth.uid() = user_id);

create policy "network_devices_update_own"
  on public.network_devices for update
  using (auth.uid() = user_id);

create policy "network_devices_delete_own"
  on public.network_devices for delete
  using (auth.uid() = user_id);

drop trigger if exists network_devices_set_updated_at on public.network_devices;
create trigger network_devices_set_updated_at
  before update on public.network_devices
  for each row
  execute procedure public.set_updated_at();

create table if not exists public.network_config_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id uuid not null references public.network_devices (id) on delete cascade,
  captured_at timestamptz not null default now(),
  config_hash text,
  snapshot_ref text,
  captured_by text,
  created_at timestamptz not null default now()
);

create index if not exists network_config_snapshots_device_captured_idx
  on public.network_config_snapshots (device_id, captured_at desc);

alter table public.network_config_snapshots enable row level security;

create policy "network_config_snapshots_select_own"
  on public.network_config_snapshots for select
  using (auth.uid() = user_id);

create policy "network_config_snapshots_insert_own"
  on public.network_config_snapshots for insert
  with check (auth.uid() = user_id);

create policy "network_config_snapshots_update_own"
  on public.network_config_snapshots for update
  using (auth.uid() = user_id);

create table if not exists public.network_drift_findings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id uuid not null references public.network_devices (id) on delete cascade,
  finding_type text not null check (finding_type in ('firmware', 'config')),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  summary text not null,
  detected_at timestamptz not null default now(),
  status text not null default 'open'
    check (status in ('open', 'approved', 'resolved')),
  approval_request_id uuid references public.approval_requests (id) on delete set null,
  incident_id uuid references public.incidents (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists network_drift_findings_user_status_detected_idx
  on public.network_drift_findings (user_id, status, detected_at desc);

alter table public.network_drift_findings enable row level security;

create policy "network_drift_findings_select_own"
  on public.network_drift_findings for select
  using (auth.uid() = user_id);

create policy "network_drift_findings_insert_own"
  on public.network_drift_findings for insert
  with check (auth.uid() = user_id);

create policy "network_drift_findings_update_own"
  on public.network_drift_findings for update
  using (auth.uid() = user_id);

create policy "network_drift_findings_delete_own"
  on public.network_drift_findings for delete
  using (auth.uid() = user_id);

drop trigger if exists network_drift_findings_set_updated_at on public.network_drift_findings;
create trigger network_drift_findings_set_updated_at
  before update on public.network_drift_findings
  for each row
  execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Access posture + policy rules
-- ---------------------------------------------------------------------------
create table if not exists public.access_posture_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  captured_at timestamptz not null default now(),
  mfa_coverage_percent numeric(5,2),
  privileged_accounts_total integer,
  privileged_accounts_mfa_enabled integer,
  stale_privileged_accounts integer,
  source_system text,
  created_at timestamptz not null default now()
);

create index if not exists access_posture_snapshots_user_captured_idx
  on public.access_posture_snapshots (user_id, captured_at desc);

alter table public.access_posture_snapshots enable row level security;

create policy "access_posture_snapshots_select_own"
  on public.access_posture_snapshots for select
  using (auth.uid() = user_id);

create policy "access_posture_snapshots_insert_own"
  on public.access_posture_snapshots for insert
  with check (auth.uid() = user_id);

create policy "access_posture_snapshots_update_own"
  on public.access_posture_snapshots for update
  using (auth.uid() = user_id);

create table if not exists public.access_policy_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rule_name text not null,
  min_mfa_coverage_percent numeric(5,2),
  block_high_risk_without_approval boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_policy_rules_user_updated_idx
  on public.access_policy_rules (user_id, updated_at desc);

alter table public.access_policy_rules enable row level security;

create policy "access_policy_rules_select_own"
  on public.access_policy_rules for select
  using (auth.uid() = user_id);

create policy "access_policy_rules_insert_own"
  on public.access_policy_rules for insert
  with check (auth.uid() = user_id);

create policy "access_policy_rules_update_own"
  on public.access_policy_rules for update
  using (auth.uid() = user_id);

create policy "access_policy_rules_delete_own"
  on public.access_policy_rules for delete
  using (auth.uid() = user_id);

drop trigger if exists access_policy_rules_set_updated_at on public.access_policy_rules;
create trigger access_policy_rules_set_updated_at
  before update on public.access_policy_rules
  for each row
  execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Change windows + actions
-- ---------------------------------------------------------------------------
create table if not exists public.change_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  service_id uuid references public.services (id) on delete set null,
  environment text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  risk_level text not null default 'medium'
    check (risk_level in ('low', 'medium', 'high', 'critical')),
  requires_approval boolean not null default true,
  owner_hint text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists change_windows_user_start_idx
  on public.change_windows (user_id, starts_at asc);

alter table public.change_windows enable row level security;

create policy "change_windows_select_own"
  on public.change_windows for select
  using (auth.uid() = user_id);

create policy "change_windows_insert_own"
  on public.change_windows for insert
  with check (auth.uid() = user_id);

create policy "change_windows_update_own"
  on public.change_windows for update
  using (auth.uid() = user_id);

create policy "change_windows_delete_own"
  on public.change_windows for delete
  using (auth.uid() = user_id);

drop trigger if exists change_windows_set_updated_at on public.change_windows;
create trigger change_windows_set_updated_at
  before update on public.change_windows
  for each row
  execute procedure public.set_updated_at();

create table if not exists public.change_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  change_window_id uuid not null references public.change_windows (id) on delete cascade,
  action_type text not null,
  target_ref text,
  status text not null default 'planned'
    check (status in ('planned', 'executed', 'rolled_back', 'cancelled')),
  approval_request_id uuid references public.approval_requests (id) on delete set null,
  incident_id uuid references public.incidents (id) on delete set null,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists change_actions_user_created_idx
  on public.change_actions (user_id, created_at desc);

create index if not exists change_actions_window_created_idx
  on public.change_actions (change_window_id, created_at desc);

alter table public.change_actions enable row level security;

create policy "change_actions_select_own"
  on public.change_actions for select
  using (auth.uid() = user_id);

create policy "change_actions_insert_own"
  on public.change_actions for insert
  with check (auth.uid() = user_id);

create policy "change_actions_update_own"
  on public.change_actions for update
  using (auth.uid() = user_id);

create policy "change_actions_delete_own"
  on public.change_actions for delete
  using (auth.uid() = user_id);

drop trigger if exists change_actions_set_updated_at on public.change_actions;
create trigger change_actions_set_updated_at
  before update on public.change_actions
  for each row
  execute procedure public.set_updated_at();
