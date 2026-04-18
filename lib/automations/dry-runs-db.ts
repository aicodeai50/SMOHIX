import type { SupabaseClient } from "@supabase/supabase-js";

import type { DryRunRecord } from "@/lib/automations/runs-dev";

type Row = {
  id: string;
  playbook_id: string;
  ok: boolean;
  detail: string | null;
  created_at: string;
};

function mapRow(r: Row): DryRunRecord {
  return {
    id: r.id,
    playbookId: r.playbook_id,
    ok: r.ok,
    detail: r.detail ?? "",
    at: r.created_at,
  };
}

export async function insertAutomationDryRun(
  supabase: SupabaseClient,
  userId: string,
  input: { playbookId: string; ok: boolean; detail: string },
): Promise<DryRunRecord | null> {
  const { data, error } = await supabase
    .from("automation_dry_runs")
    .insert({
      user_id: userId,
      playbook_id: input.playbookId,
      ok: input.ok,
      detail: input.detail,
    })
    .select("id, playbook_id, ok, detail, created_at")
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
    .select("id, playbook_id, ok, detail, created_at")
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
