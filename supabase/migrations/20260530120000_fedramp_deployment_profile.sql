-- FedRAMP-oriented deployment profile on organizations (region + data boundary).
-- Regulated buyers pin residency and isolation tier at the org level.

alter table public.organizations
  add column if not exists deployment_tier text not null default 'standard'
    check (deployment_tier in ('standard', 'regulated', 'fedramp_ready'));

alter table public.organizations
  add column if not exists data_region text not null default 'us-east-1';

alter table public.organizations
  add column if not exists data_boundary text not null default 'shared'
    check (data_boundary in ('shared', 'dedicated_project', 'gov_cloud'));

alter table public.organizations
  add column if not exists boundary_notes text;

create index if not exists organizations_deployment_tier_idx
  on public.organizations (deployment_tier, data_region);

comment on column public.organizations.deployment_tier is
  'standard | regulated | fedramp_ready — procurement / isolation posture';
comment on column public.organizations.data_region is
  'Logical residency pin (e.g. us-east-1, us-gov-east-1, eu-west-1)';
comment on column public.organizations.data_boundary is
  'shared | dedicated_project | gov_cloud — Supabase project isolation model';
