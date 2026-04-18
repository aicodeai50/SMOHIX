import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

import {
  getDevIncident,
  listDevIncidents,
  updateDevIncidentStatus,
} from "./dev-store";
import { formatIncidentRelative } from "./format";
import type {
  IncidentDetail,
  IncidentRow,
  IncidentSeverity,
  IncidentsListResult,
} from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function mapDbRow(
  r: {
    id: string;
    title: string;
    severity: string;
    status: string;
    updated_at: string;
  },
  serviceName?: string | null,
): IncidentRow {
  return {
    id: r.id,
    title: r.title,
    severity: r.severity as IncidentRow["severity"],
    status: r.status,
    updated: formatIncidentRelative(r.updated_at),
    serviceName: serviceName ?? undefined,
  };
}

function serviceNameFromJoin(
  row: { services?: { name?: string } | { name?: string }[] | null },
): string | null {
  const s = row.services;
  if (!s) return null;
  if (Array.isArray(s)) {
    const n = s[0]?.name;
    return typeof n === "string" ? n : null;
  }
  return typeof s.name === "string" ? s.name : null;
}

function sessionRows(devTenantKey: string | null): IncidentRow[] {
  return devTenantKey ? listDevIncidents(devTenantKey) : [];
}

/**
 * Lists incidents: Supabase `incidents` when auth is configured; otherwise session-scoped rows
 * (`shynvo_dev_tid` cookie).
 */
export async function listIncidentsForUser(
  userId: string,
  devTenantKey: string | null = null,
): Promise<IncidentsListResult> {
  if (!hasSupabaseAuth()) {
    return { source: "session", rows: sessionRows(devTenantKey) };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("incidents")
      .select("id, title, severity, status, updated_at, services(name)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return { source: "database", rows: [] };
    }

    const rows = (data ?? []).map((r) => {
      const rec = r as Record<string, unknown>;
      return mapDbRow(
        {
          id: rec.id as string,
          title: rec.title as string,
          severity: rec.severity as string,
          status: rec.status as string,
          updated_at: rec.updated_at as string,
        },
        serviceNameFromJoin(rec as { services?: { name?: string } | null }),
      );
    });

    return { source: "database", rows };
  } catch {
    return { source: "database", rows: [] };
  }
}

export type IncidentDetailResult =
  | { source: "database"; row: IncidentDetail }
  | { source: "session"; row: IncidentDetail }
  | null;

export async function getIncidentForUser(
  userId: string,
  id: string,
  devTenantKey: string | null = null,
): Promise<IncidentDetailResult> {
  if (devTenantKey && id.startsWith("dev-")) {
    const row = getDevIncident(devTenantKey, id);
    if (row) {
      return {
        source: "session",
        row: {
          ...row,
          postmortem: null,
          serviceId: null,
        },
      };
    }
  }

  if (isUuid(id) && hasSupabaseAuth()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("incidents")
        .select("id, title, severity, status, updated_at, postmortem, service_id, services(name)")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        const rec = data as Record<string, unknown>;
        const base = mapDbRow(
          {
            id: rec.id as string,
            title: rec.title as string,
            severity: rec.severity as string,
            status: rec.status as string,
            updated_at: rec.updated_at as string,
          },
          serviceNameFromJoin(rec as { services?: { name?: string } | null }),
        );
        const sid = rec.service_id;
        return {
          source: "database",
          row: {
            ...base,
            postmortem: typeof rec.postmortem === "string" ? rec.postmortem : null,
            serviceId: typeof sid === "string" ? sid : null,
          },
        };
      }
    } catch {
      /* not found */
    }
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
  options?: { devTenantKey?: string | null },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const s = status.trim();
  if (!STATUSES.has(s)) {
    return { ok: false, reason: "Invalid status." };
  }

  if (!hasSupabaseAuth()) {
    const tid = options?.devTenantKey;
    if (tid && id.startsWith("dev-") && updateDevIncidentStatus(tid, id, s)) {
      return { ok: true };
    }
    return { ok: false, reason: "Cannot update in this environment." };
  }

  if (!isUuid(id)) {
    return { ok: false, reason: "Cannot update in this environment." };
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
  input: {
    title: string;
    severity: string;
    status?: string;
    serviceId?: string | null;
    externalRef?: string | null;
    postmortem?: string | null;
  },
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
  const serviceId =
    typeof input.serviceId === "string" && isUuid(input.serviceId) ? input.serviceId : null;
  const externalRef = input.externalRef?.trim() || null;
  const postmortem = input.postmortem?.trim() || null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("incidents")
      .insert({
        user_id: userId,
        title,
        severity,
        status,
        ...(serviceId ? { service_id: serviceId } : {}),
        ...(externalRef ? { external_ref: externalRef } : {}),
        ...(postmortem ? { postmortem } : {}),
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

export async function updateIncidentPostmortemForUser(
  userId: string,
  id: string,
  postmortem: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!hasSupabaseAuth() || !isUuid(id)) {
    return { ok: false, reason: "Cannot update in this environment." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("incidents")
      .update({
        postmortem: postmortem.trim() || null,
        updated_at: new Date().toISOString(),
      })
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
