-- Committee obligation capacity budget: hours per obligation and per owner per week.

alter table public.organizations
  add column if not exists compliance_capacity_hours_per_obligation numeric(4,1) not null default 2.0;

alter table public.organizations
  add column if not exists compliance_capacity_owner_hours_per_week numeric(4,1) not null default 8.0;

alter table public.organizations
  drop constraint if exists organizations_compliance_capacity_hours_per_obligation_check;

alter table public.organizations
  add constraint organizations_compliance_capacity_hours_per_obligation_check
  check (compliance_capacity_hours_per_obligation between 0.5 and 16);

alter table public.organizations
  drop constraint if exists organizations_compliance_capacity_owner_hours_per_week_check;

alter table public.organizations
  add constraint organizations_compliance_capacity_owner_hours_per_week_check
  check (compliance_capacity_owner_hours_per_week between 4 and 40);

comment on column public.organizations.compliance_capacity_hours_per_obligation is
  'Estimated owner-hours required per open obligation for capacity budgeting.';

comment on column public.organizations.compliance_capacity_owner_hours_per_week is
  'Available compliance owner-hours per committee member per week.';
