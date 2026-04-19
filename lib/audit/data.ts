import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

import { intentTagsForEventType } from "@/lib/guardrails/audit-intent-tags";
import { incidentIdFromAuditDetails } from "@/lib/audit/incident-from-details";

import type { AuditDisplayRow, AuditListResult } from "./types";

function shorten(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function formatTarget(details: Record<string, unknown> | null): string {
  if (!details || typeof details !== "object") {
    return "—";
  }
  try {
    return shorten(JSON.stringify(details), 160);
  } catch {
    return "—";
  }
}

function mapRow(r: {
  id: string;
  created_at: string;
  event_type: string;
  user_id: string | null;
  details: Record<string, unknown> | null;
}): AuditDisplayRow {
  return {
    id: r.id,
    ts: r.created_at,
    actor: r.user_id ? "account" : "system",
    action: r.event_type,
    target: formatTarget(r.details),
    outcome: "recorded",
    tags: intentTagsForEventType(r.event_type),
    incidentId: incidentIdFromAuditDetails(r.event_type, r.details),
  };
}

/**
 * Lists audit entries from `audit_log` for the signed-in user. Without auth, returns an empty session view.
 */
export async function listAuditEntriesForUser(
  userId: string | null,
): Promise<AuditListResult> {
  if (!hasSupabaseAuth() || !userId) {
    return { source: "session", rows: [] };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, created_at, event_type, user_id, details")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return { source: "database", rows: [] };
    }

    const rows = (data ?? []).map((r) =>
      mapRow({
        id: r.id as string,
        created_at: r.created_at as string,
        event_type: r.event_type as string,
        user_id: (r.user_id as string | null) ?? null,
        details: (r.details as Record<string, unknown> | null) ?? null,
      }),
    );

    return { source: "database", rows };
  } catch {
    return { source: "database", rows: [] };
  }
}
