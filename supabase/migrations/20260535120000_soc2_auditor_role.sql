-- SOC 2 Type II: external auditor role (read-only compliance workspace).

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in (
    'owner', 'admin', 'operator', 'approver', 'security_reviewer', 'viewer', 'auditor'
  ));

comment on constraint organization_members_role_check on public.organization_members is
  'Org RBAC incl. auditor — read-only SOC 2 Type II workspace (governance/compliance, audit).';
