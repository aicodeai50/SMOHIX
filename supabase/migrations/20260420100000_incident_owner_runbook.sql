-- Incident ownership hint + optional linked runbook (slug matches in-repo catalog).

alter table public.incidents
  add column if not exists owner_hint text;

alter table public.incidents
  add column if not exists runbook_slug text;

comment on column public.incidents.owner_hint is 'Responder or team label (e.g. @oncall-platform).';
comment on column public.incidents.runbook_slug is 'Optional slug from built-in runbook catalog (e.g. api-latency).';
