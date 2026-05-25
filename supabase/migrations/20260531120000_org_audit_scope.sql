-- Org-scoped audit log: share append-only evidence across organization members.
-- Backward compatible: org_id null keeps per-user RLS (audit_log_select_own).

alter table public.audit_log
  add column if not exists org_id uuid references public.organizations (id) on delete cascade;

create index if not exists audit_log_org_created_idx
  on public.audit_log (org_id, created_at desc)
  where org_id is not null;

create index if not exists audit_log_org_event_created_idx
  on public.audit_log (org_id, event_type, created_at desc)
  where org_id is not null;

create policy "audit_log_select_org"
  on public.audit_log for select
  using (org_id is not null and public.is_org_member(org_id));
