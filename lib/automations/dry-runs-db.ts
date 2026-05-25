import type { SupabaseClient } from "@supabase/supabase-js";

import type { DryRunRecord } from "@/lib/automations/runs-dev";
import { orgScopeOrFilter } from "@/lib/org/scope";

type Row = {
  id: string;
  playbook_id: string;
  ok: boolean;
  detail: string | null;
  created_at: string;
  incident_id: string | null;
};

function mapRow(r: Row): DryRunRecord {
  return {
    id: r.id,
    playbookId: r.playbook_id,
    ok: r.ok,
    detail: r.detail ?? "",
    at: r.created_at,
    incidentId: r.incident_id ?? null,
  };
}

export async function insertAutomationDryRun(
  supabase: SupabaseClient,
  userId: string,
  input: {
    playbookId: string;
    ok: boolean;
    detail: string;
    incidentId?: string | null;
    orgId?: string | null;
  },
): Promise<DryRunRecord | null> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    playbook_id: input.playbookId,
    ok: input.ok,
    detail: input.detail,
  };
  if (input.incidentId) {
    payload.incident_id = input.incidentId;
  }
  if (input.orgId) {
    payload.org_id = input.orgId;
  }

  const { data, error } = await supabase
    .from("automation_dry_runs")
    .insert(payload)
    .select("id, playbook_id, ok, detail, created_at, incident_id")
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[automation_dry_runs]", error?.message);
    }
    return null;
  }

  return mapRow(data as Row);
}

export async function listAutomationDryRuns(
  supabase: SupabaseClient,
  params?: { userId?: string; orgId?: string | null },
): Promise<{ runs: DryRunRecord[]; fromDb: boolean }> {
  const scopeFilter =
    params?.userId && params.orgId
      ? orgScopeOrFilter(params.userId, params.orgId)
      : null;

  let query = supabase
    .from("automation_dry_runs")
    .select("id, playbook_id, ok, detail, created_at, incident_id")
    .order("created_at", { ascending: false })
    .limit(40);

  if (scopeFilter) {
    query = query.or(scopeFilter);
  } else if (params?.userId) {
    query = query.eq("user_id", params.userId);
  }

  const { data, error } = await query;

  if (error || !data) {
    if (process.env.NODE_ENV === "development" && error) {
      console.warn("[automation_dry_runs]", error.message);
    }
    return { runs: [], fromDb: false };
  }

  return { runs: (data as Row[]).map(mapRow), fromDb: true };
}

/** Latest dry-run row for a given incident, for incident header intelligence. */
export async function getLatestDryRunForIncident(
  supabase: SupabaseClient,
  userId: string,
  incidentId: string,
  orgId: string | null = null,
): Promise<DryRunRecord | null> {
  const scopeFilter = orgScopeOrFilter(userId, orgId);
  let query = supabase
    .from("automation_dry_runs")
    .select("id, playbook_id, ok, detail, created_at, incident_id")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (scopeFilter) {
    query = query.or(scopeFilter);
  } else {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data as Row);
}
