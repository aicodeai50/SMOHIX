import type { SupabaseClient } from "@supabase/supabase-js";

import type { DryRunRecord } from "@/lib/automations/runs-dev";

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
): Promise<{ runs: DryRunRecord[]; fromDb: boolean }> {
  const { data, error } = await supabase
    .from("automation_dry_runs")
    .select("id, playbook_id, ok, detail, created_at, incident_id")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error || !data) {
    if (process.env.NODE_ENV === "development" && error) {
      console.warn("[automation_dry_runs]", error.message);
    }
    return { runs: [], fromDb: false };
  }

  return { runs: (data as Row[]).map(mapRow), fromDb: true };
}

/** Latest dry-run row for a given incident (same user), for incident header intelligence. */
export async function getLatestDryRunForIncident(
  supabase: SupabaseClient,
  userId: string,
  incidentId: string,
): Promise<DryRunRecord | null> {
  const { data, error } = await supabase
    .from("automation_dry_runs")
    .select("id, playbook_id, ok, detail, created_at, incident_id")
    .eq("user_id", userId)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRow(data as Row);
}
