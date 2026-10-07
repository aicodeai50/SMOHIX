-- PostgREST ON CONFLICT (org_id, service_id, slo_name) cannot infer
-- the previous partial index without a matching predicate.
-- A regular unique index preserves the same uniqueness for organization rows.
-- NULL organization IDs remain distinct; the existing user index covers them.
begin;

create unique index if not exists service_slos_org_upsert_uidx
  on public.service_slos (org_id, service_id, slo_name);

drop index if exists public.service_slos_org_service_slo_uidx;

commit;
