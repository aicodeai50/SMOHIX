import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

import { DEMO_INCIDENTS } from "./demo";
import type { IncidentRow, IncidentSeverity, IncidentsListResult } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function formatRelative(updatedAt: string): string {
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return updatedAt;
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(updatedAt).toLocaleDateString();
}

function mapDbRow(r: {
  id: string;
  title: string;
  severity: string;
  status: string;
  updated_at: string;
}): IncidentRow {
  return {
    id: r.id,
    title: r.title,
    severity: r.severity as IncidentRow["severity"],
    status: r.status,
    updated: formatRelative(r.updated_at),
  };
}

/**
 * Lists incidents for the console. Uses Supabase when auth + table exist; otherwise demo rows.
 */
export async function listIncidentsForUser(userId: string): Promise<IncidentsListResult> {
  if (!hasSupabaseAuth()) {
    return { source: "demo", rows: DEMO_INCIDENTS };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("incidents")
      .select("id, title, severity, status, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      const missing =
        error.code === "42P01" ||
        error.message.toLowerCase().includes("relation") ||
        error.message.toLowerCase().includes("does not exist");
      if (missing) {
        return { source: "demo", rows: DEMO_INCIDENTS };
      }
      return { source: "demo", rows: DEMO_INCIDENTS };
    }

    const rows = (data ?? []).map((r) =>
      mapDbRow({
        id: r.id as string,
        title: r.title as string,
        severity: r.severity as string,
        status: r.status as string,
        updated_at: r.updated_at as string,
      }),
    );

    return { source: "database", rows };
  } catch {
    return { source: "demo", rows: DEMO_INCIDENTS };
  }
}

export type IncidentDetailResult =
  | { source: "database"; row: IncidentRow }
  | { source: "demo"; row: IncidentRow }
  | null;

export async function getIncidentForUser(
  userId: string,
  id: string,
): Promise<IncidentDetailResult> {
  if (isUuid(id) && hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("incidents")
        .select("id, title, severity, status, updated_at")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        return {
          source: "database",
          row: mapDbRow({
            id: data.id as string,
            title: data.title as string,
            severity: data.severity as string,
            status: data.status as string,
            updated_at: data.updated_at as string,
          }),
        };
      }
    } catch {
      // fall through to demo
    }
  }

  const demo = DEMO_INCIDENTS.find((r) => r.id === id);
  if (demo) {
    return { source: "demo", row: demo };
  }
  return null;
}

const SEVERITIES = new Set<IncidentSeverity>(["low", "medium", "high", "critical"]);

const STATUSES = new Set([
  "investigating",
  "mitigated",
  "resolved",
  "monitoring",
]);

export async function updateIncidentStatusForUser(
  userId: string,
  id: string,
  status: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!hasSupabaseAuth() || !isUuid(id)) {
    return { ok: false, reason: "Cannot update in this environment." };
  }
  const s = status.trim();
  if (!STATUSES.has(s)) {
    return { ok: false, reason: "Invalid status." };
  }
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("incidents")
      .update({ status: s, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Update failed.",
    };
  }
}

export async function createIncidentForUser(
  userId: string,
  input: { title: string; severity: string; status?: string },
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  if (!hasSupabaseAuth()) {
    return { ok: false, reason: "Supabase is not configured." };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, reason: "Title is required." };
  }

  const severity = SEVERITIES.has(input.severity as IncidentSeverity)
    ? (input.severity as IncidentSeverity)
    : "medium";
  const status = (input.status ?? "investigating").trim() || "investigating";

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("incidents")
      .insert({
        user_id: userId,
        title,
        severity,
        status,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, reason: error.message };
    }
    if (!data?.id) {
      return { ok: false, reason: "Insert returned no id." };
    }
    return { ok: true, id: data.id as string };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Could not create incident.",
    };
  }
}
