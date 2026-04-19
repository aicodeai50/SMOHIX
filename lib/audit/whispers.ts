import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

export type AuditWhisper = {
  summary: string;
  eventType: string;
  atLabel: string;
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function whisperForRow(
  et: string,
  details: Record<string, unknown> | null,
  atLabel: string,
): AuditWhisper | null {
  if (et === "automation.dry_run") {
    const pid = typeof details?.playbook_id === "string" ? details.playbook_id : "playbook";
    const ok = details?.ok === true;
    const inc =
      typeof details?.incident_id === "string" ? details.incident_id.slice(0, 36) : null;
    const scope = inc ? " (linked to an incident)" : "";
    return {
      eventType: et,
      atLabel,
      summary: ok
        ? `Dry-run completed for “${pid}”${scope} and was written to your audit trail.`
        : `Dry-run for “${pid}”${scope} finished with issues — see the audit log.`,
    };
  }
  if (et === "approval.approved") {
    return {
      eventType: et,
      atLabel,
      summary:
        "An approval request was approved on your account — execution may proceed per your policy.",
    };
  }
  if (et === "approval.denied") {
    return {
      eventType: et,
      atLabel,
      summary: "An approval request was denied — gated work should remain blocked.",
    };
  }
  if (et === "approval.requested") {
    const label =
      typeof details?.action_label === "string" ? details.action_label.slice(0, 120) : "change";
    return {
      eventType: et,
      atLabel,
      summary: `New approval requested: “${label}”.`,
    };
  }
  if (et === "incident.status_updated") {
    const st = typeof details?.status === "string" ? details.status : "updated";
    return {
      eventType: et,
      atLabel,
      summary: `Incident status updated to “${st}”.`,
    };
  }
  if (et === "incident.context_updated") {
    return {
      eventType: et,
      atLabel,
      summary: "Incident owner or runbook context was updated.",
    };
  }
  if (et === "incident.postmortem_updated") {
    return {
      eventType: et,
      atLabel,
      summary: "Incident notes / postmortem were saved.",
    };
  }
  return null;
}

/**
 * Latest account-scoped audit row useful for inline “trust” copy outside /audit.
 */
export async function getLatestAuditWhisper(userId: string | null): Promise<AuditWhisper | null> {
  if (!hasSupabaseAuth() || !userId) {
    return null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("created_at, event_type, details")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error || !data?.length) {
      return null;
    }

    for (const row of data) {
      const et = String(row.event_type ?? "");
      const details = (row.details as Record<string, unknown> | null) ?? null;
      const atLabel = formatTime(String(row.created_at ?? ""));
      const w = whisperForRow(et, details, atLabel);
      if (w) {
        return w;
      }
    }

    const first = data[0];
    return {
      eventType: String(first.event_type ?? "event"),
      atLabel: formatTime(String(first.created_at ?? "")),
      summary: `Latest audit event: ${String(first.event_type ?? "recorded")}.`,
    };
  } catch {
    return null;
  }
}

/**
 * Latest audit row whose `details.incident_id` matches (for incident detail “whispers”).
 */
export async function getLatestAuditWhisperForIncident(
  userId: string,
  incidentId: string,
): Promise<AuditWhisper | null> {
  if (!hasSupabaseAuth() || !userId || !incidentId) {
    return null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("created_at, event_type, details")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data?.length) {
      return null;
    }

    const scoped = data.filter((row) => {
      const d = row.details as Record<string, unknown> | null;
      return d && String(d.incident_id ?? "") === incidentId;
    });

    for (const row of scoped) {
      const et = String(row.event_type ?? "");
      const details = (row.details as Record<string, unknown> | null) ?? null;
      const atLabel = formatTime(String(row.created_at ?? ""));
      const w = whisperForRow(et, details, atLabel);
      if (w) {
        return w;
      }
    }

    if (scoped.length > 0) {
      const row = scoped[0];
      const et = String(row.event_type ?? "event");
      return {
        eventType: et,
        atLabel: formatTime(String(row.created_at ?? "")),
        summary: `Latest linked event on this incident: ${et}.`,
      };
    }

    return null;
  } catch {
    return null;
  }
}
