-- Defense in depth for legacy permissive owner policies.
-- No rows are deleted or reassigned. Apply through the normal migration process.

-- A permissive policy cannot override a restrictive policy. Personal legacy rows
-- remain readable by their owner; organization rows require current membership.
do $migration$
declare
  resource text;
  write_roles text[];
begin
  foreach resource in array array[
    'incidents', 'services', 'automation_dry_runs', 'automation_executions',
    'service_slos', 'error_budget_windows', 'service_dependencies',
    'approval_requests', 'policy_suggestions', 'copilot_threads', 'automation_policy_versions',
    'api_keys', 'alert_ingest_tokens', 'audit_log', 'subscriptions'
  ] loop
    execute format('create policy workspace_scope_guard on public.%I as restrictive for all to authenticated
      using ((org_id is null and user_id = auth.uid()) or
             (org_id is not null and public.is_org_member(org_id)))
      with check ((org_id is null and user_id = auth.uid()) or
                  (org_id is not null and public.is_org_member(org_id)))', resource);

    if resource in ('incidents', 'services', 'automation_dry_runs', 'automation_executions',
                    'service_slos', 'error_budget_windows', 'service_dependencies',
                    'policy_suggestions', 'automation_policy_versions', 'api_keys', 'alert_ingest_tokens') then
      write_roles := array['owner', 'admin', 'operator'];
      execute format('create policy workspace_insert_role_guard on public.%I as restrictive for insert to authenticated
        with check ((org_id is null and user_id = auth.uid()) or
          (org_id is not null and user_id = auth.uid() and public.has_org_role(org_id, %L::text[])))', resource, write_roles);
      if resource = 'policy_suggestions' then
        write_roles := array['owner', 'admin', 'security_reviewer'];
      end if;
      -- Keys may only be changed by organization admins, matching their existing org policy.
      if resource in ('api_keys', 'alert_ingest_tokens') then
        write_roles := array['owner', 'admin'];
      end if;
      execute format('create policy workspace_update_role_guard on public.%I as restrictive for update to authenticated
        using (org_id is null or public.has_org_role(org_id, %L::text[]))
        with check (org_id is null or public.has_org_role(org_id, %L::text[]))', resource, write_roles, write_roles);
      execute format('create policy workspace_delete_role_guard on public.%I as restrictive for delete to authenticated
        using (org_id is null or public.has_org_role(org_id, %L::text[]))', resource, write_roles);
    end if;
  end loop;
end;
$migration$;

-- Membership alone does not authorize submitting an organization approval.
create policy workspace_approval_insert_guard on public.approval_requests
  as restrictive for insert to authenticated
  with check (status = 'pending' and decided_by is null and
    ((org_id is null and user_id = auth.uid()) or
     (org_id is not null and user_id = auth.uid() and requester_id = auth.uid()
      and public.has_org_role(org_id, array['owner', 'admin', 'operator']))));

create policy workspace_key_visibility_guard on public.api_keys
  as restrictive for select to authenticated
  using (org_id is null or public.has_org_role(org_id, array['owner', 'admin', 'operator']));
create policy workspace_token_visibility_guard on public.alert_ingest_tokens
  as restrictive for select to authenticated
  using (org_id is null or public.has_org_role(org_id, array['owner', 'admin', 'operator']));

-- Once a record exists, its tenant and creator cannot be changed through client APIs.
-- Trusted server maintenance (no end-user identity) retains its existing access.
create or replace function public.guard_workspace_record_identity()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and
     (new.org_id is distinct from old.org_id or new.user_id is distinct from old.user_id) then
    raise exception using errcode = '42501', message = 'Workspace identity cannot be changed';
  end if;
  return new;
end;
$$;

do $migration$
declare resource text;
begin
  foreach resource in array array[
    'incidents', 'services', 'automation_dry_runs', 'automation_executions',
    'service_slos', 'error_budget_windows', 'service_dependencies',
    'approval_requests', 'policy_suggestions', 'copilot_threads', 'automation_policy_versions',
    'api_keys', 'alert_ingest_tokens', 'audit_log', 'subscriptions', 'organization_members'
  ] loop
    execute format('create trigger workspace_identity_guard before update on public.%I
      for each row execute function public.guard_workspace_record_identity()', resource);
  end loop;
end;
$migration$;

-- Owner membership is created by the existing security-definer bootstrap RPC.
-- Ordinary clients cannot promote another member to owner or demote the owner.
create policy member_insert_role_guard on public.organization_members
  as restrictive for insert to authenticated
  with check (role <> 'owner' and public.has_org_role(org_id, array['owner', 'admin']));
create policy member_update_role_guard on public.organization_members
  as restrictive for update to authenticated
  using (role <> 'owner' and public.has_org_role(org_id, array['owner', 'admin']))
  with check (role <> 'owner' and public.has_org_role(org_id, array['owner', 'admin']));

-- Explicit WITH CHECK is essential: the old pending-only USING expression would
-- otherwise also require the updated row to remain pending for delegated reviewers.
drop policy if exists approval_requests_update_org_decide on public.approval_requests;
create policy approval_requests_update_org_decide on public.approval_requests
  for update to authenticated
  using (org_id is not null and status = 'pending'
    and public.has_org_role(org_id, array['owner', 'admin', 'approver', 'security_reviewer']))
  with check (org_id is not null and status in ('approved', 'denied')
    and decided_by = auth.uid()
    and public.has_org_role(org_id, array['owner', 'admin', 'approver', 'security_reviewer']));

create or replace function public.guard_workspace_approval_decision()
returns trigger language plpgsql set search_path = public as $$
declare risk numeric;
begin
  if auth.uid() is null or old.org_id is null then return new; end if;
  if old.status <> 'pending' or new.status not in ('approved', 'denied')
     or new.decided_by is distinct from auth.uid()
     or coalesce(old.requester_id, old.user_id) = auth.uid()
     or not public.has_org_role(old.org_id, array['owner', 'admin', 'approver', 'security_reviewer']) then
    raise exception using errcode = '42501', message = 'Approval decision is not permitted';
  end if;
  if new.action_label is distinct from old.action_label
     or new.policy_hint is distinct from old.policy_hint
     or new.requester_id is distinct from old.requester_id then
    raise exception using errcode = '42501', message = 'Approval request cannot be rewritten';
  end if;
  if not public.has_org_role(old.org_id, array['owner', 'admin', 'approver']) then
    if jsonb_typeof(old.decision_brief_json -> 'riskScore') is distinct from 'number' then
      raise exception using errcode = '42501', message = 'Approval risk requires review';
    end if;
    risk := round((old.decision_brief_json ->> 'riskScore')::numeric);
    if risk < 70 then
      raise exception using errcode = '42501', message = 'Approval risk requires review';
    end if;
  end if;
  return new;
end;
$$;
create trigger workspace_approval_decision_guard before update on public.approval_requests
  for each row execute function public.guard_workspace_approval_decision();

-- Message access follows the parent thread, including revoked membership checks.
create policy workspace_thread_guard on public.copilot_messages
  as restrictive for all to authenticated
  using (exists (select 1 from public.copilot_threads t where t.id = thread_id))
  with check (exists (select 1 from public.copilot_threads t where t.id = thread_id));


-- Exact directory lookup is server-only; no customer can enumerate registered users.
-- This avoids scanning paginated admin lists as the account directory grows.
create or replace function public.find_workspace_member_account(p_email text)
returns uuid language sql stable security definer set search_path = public as $$
  select id from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
$$;
revoke all on function public.find_workspace_member_account(text) from public;
revoke all on function public.find_workspace_member_account(text) from anon, authenticated;
grant execute on function public.find_workspace_member_account(text) to service_role;
