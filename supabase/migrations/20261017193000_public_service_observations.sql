-- Public service availability only: never store workspace records, URLs or diagnostics.
create table if not exists public.public_service_observations (
  product_id text not null check (product_id in ('smohix-platform','smohix-ai','smohix-assistant','private-ai','smohix-own-api','identity')),
  status text not null check (status in ('operational','degraded','unavailable','unknown')),
  checked_at timestamptz not null,
  primary key (product_id, checked_at)
);
create index if not exists public_service_observations_checked_idx on public.public_service_observations (checked_at desc);
alter table public.public_service_observations enable row level security;
revoke all on public.public_service_observations from public, anon, authenticated;
grant select, insert, update, delete on public.public_service_observations to service_role;
comment on table public.public_service_observations is 'Sanitized public availability samples. Writes are restricted to the trusted scheduler.';
