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

const INCIDENT_AUDIT_TYPES = [
  "incident.status_updated",
  "incident.context_updated",
  "incident.postmortem_updated",
  "incident.rca_generated",
  "incident.comment_added",
  "incident.handoff_added",
  "incident.copilot_context_added",
] as const;

/** Timeline for a DB-backed incident from `audit_log`. */
export async function listIncidentTimelineFromAudit(
  userId: string,
  incidentId: string,
  orgId?: string | null,
): Promise<IncidentTimelineEntry[]> {
  if (!hasSupabaseAuth() || !userId) {
    return [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("audit_log")
      .select("created_at, event_type, details")
      .in("event_type", [...INCIDENT_AUDIT_TYPES])
      .order("created_at", { ascending: false })
      .limit(100);

    query = orgId ? query.or(`user_id.eq.${userId},org_id.eq.${orgId}`) : query.eq("user_id", userId);

    const { data, error } = await query;

    if (error || !data) {
      return [];
    }

    const out: IncidentTimelineEntry[] = [];
    for (const row of data) {
      const details = row.details as Record<string, unknown> | null;
      if (!details || String(details.incident_id ?? "") !== incidentId) {
        continue;
      }
      const et = String(row.event_type);
      if (et === "incident.status_updated") {
        const status =
          typeof details.status === "string" ? details.status : "updated";
        out.push({
          at: formatUtc(String(row.created_at)),
          label: `Status set to ${status}`,
        });
      } else if (et === "incident.context_updated") {
        out.push({
          at: formatUtc(String(row.created_at)),
          label: "Owner / runbook updated",
        });
      } else if (et === "incident.postmortem_updated") {
        out.push({
          at: formatUtc(String(row.created_at)),
          label: "Postmortem notes updated",
        });
      } else if (et === "incident.rca_generated") {
        out.push({
          at: formatUtc(String(row.created_at)),
          label: "RCA hypothesis generated",
        });
      } else if (et === "incident.comment_added") {
        out.push({
          at: formatUtc(String(row.created_at)),
          label: "Responder comment added",
        });
      } else if (et === "incident.handoff_added") {
        out.push({
          at: formatUtc(String(row.created_at)),
          label: "Incident handoff recorded",
        });
      } else if (et === "incident.copilot_context_added") {
        out.push({
          at: formatUtc(String(row.created_at)),
          label: "Copilot context snapshot recorded",
        });
      }
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
  orgId?: string | null;
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
    return listIncidentTimelineFromAudit(params.userId, params.incidentId, params.orgId);
  }

  return [];
}
