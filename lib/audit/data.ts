import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

import { DEMO_AUDIT } from "./demo";
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
  };
}

/**
 * Lists audit entries for the signed-in user when Supabase + `audit_log` exist; otherwise demo rows.
 */
export async function listAuditEntriesForUser(
  userId: string | null,
): Promise<AuditListResult> {
  if (!hasSupabaseAuth() || !userId) {
    return { source: "demo", rows: DEMO_AUDIT };
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
      const missing =
        error.code === "42P01" ||
        error.message.toLowerCase().includes("relation") ||
        error.message.toLowerCase().includes("does not exist");
      if (missing) {
        return { source: "demo", rows: DEMO_AUDIT };
      }
      return { source: "demo", rows: DEMO_AUDIT };
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
    return { source: "demo", rows: DEMO_AUDIT };
  }
}
