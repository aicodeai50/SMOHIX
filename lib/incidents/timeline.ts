import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

import { listDevIncidentTimeline } from "./timeline-dev";

export type IncidentTimelineEntry = {
  at: string;
  label: string;
};

function formatUtc(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().replace("T", " ").slice(0, 19);
  } catch {
    return iso;
  }
}

/** Timeline for a DB-backed incident from `audit_log` (`incident.status_updated`). */
export async function listIncidentTimelineFromAudit(
  userId: string,
  incidentId: string,
): Promise<IncidentTimelineEntry[]> {
  if (!hasSupabaseAuth() || !userId) {
    return [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("created_at, event_type, details")
      .eq("user_id", userId)
      .eq("event_type", "incident.status_updated")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return [];
    }

    const out: IncidentTimelineEntry[] = [];
    for (const row of data) {
      const details = row.details as Record<string, unknown> | null;
      if (!details || String(details.incident_id ?? "") !== incidentId) {
        continue;
      }
      const status =
        typeof details.status === "string" ? details.status : "updated";
      out.push({
        at: formatUtc(String(row.created_at)),
        label: `Status set to ${status}`,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function getIncidentTimeline(params: {
  source: "database" | "session";
  userId: string;
  incidentId: string;
  devTenantKey: string | null;
}): Promise<IncidentTimelineEntry[]> {
  if (params.source === "session" && params.devTenantKey) {
    return listDevIncidentTimeline(params.devTenantKey, params.incidentId).map(
      (e) => ({
        at: formatUtc(e.at),
        label: e.label,
      }),
    );
  }

  if (params.source === "database") {
    return listIncidentTimelineFromAudit(params.userId, params.incidentId);
  }

  return [];
}
