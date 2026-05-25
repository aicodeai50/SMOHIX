import { applyUserOrOrgScope } from "@/lib/org/apply-scope-query";
import type { OrgRole } from "@/lib/org/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

import { intentTagsForEventType } from "@/lib/guardrails/audit-intent-tags";
import { complianceControlsForAuditEvent } from "@/lib/compliance/map-audit";
import { incidentIdFromAuditDetails } from "@/lib/audit/incident-from-details";
import { applyAuditRoleEventFilter } from "@/lib/audit/role-filter";

import type { AuditDisplayRow, AuditListResult } from "./types";

export type AuditQueryOpts = {
  eventPrefix?: string | null;
  sinceIso?: string | null;
  orgId?: string | null;
  orgRole?: OrgRole | null;
};

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
    complianceControls: complianceControlsForAuditEvent(r.event_type),
    incidentId: incidentIdFromAuditDetails(r.event_type, r.details),
  };
}


function buildAuditListQuery(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  opts?: AuditQueryOpts,
) {
  let query = supabase
    .from("audit_log")
    .select("id, created_at, event_type, user_id, details")
    .order("created_at", { ascending: false });

  query = applyUserOrOrgScope(query, userId, opts?.orgId);

  const eventPrefix = opts?.eventPrefix?.trim();
  if (eventPrefix) {
    query = query.ilike("event_type", `${eventPrefix}%`);
  } else {
    query = applyAuditRoleEventFilter(query, opts?.orgRole);
  }

  const sinceIso = opts?.sinceIso?.trim();
  if (sinceIso) {
    query = query.gte("created_at", sinceIso);
  }

  return query;
}

function buildAuditExportQuery(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  opts: AuditQueryOpts & { slackOnly?: boolean },
) {
  let query = supabase
    .from("audit_log")
    .select("created_at, event_type, user_id, details")
    .order("created_at", { ascending: false });

  query = applyUserOrOrgScope(query, userId, opts.orgId);

  if (opts.slackOnly) {
    query = query.ilike("event_type", "slack.%");
  } else {
    query = applyAuditRoleEventFilter(query, opts.orgRole);
  }

  const sinceIso = opts.sinceIso?.trim();
  if (sinceIso) {
    query = query.gte("created_at", sinceIso);
  }

  return query;
}

/**
 * Lists audit entries from `audit_log` for the signed-in user (and active org when set).
 */
export async function listAuditEntriesForUser(
  userId: string | null,
  opts?: AuditQueryOpts,
): Promise<AuditListResult> {
  if (!hasSupabaseAuth() || !userId) {
    return { source: "session", rows: [] };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await buildAuditListQuery(supabase, userId, opts).limit(100);

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

export type SlackAuditCsvRow = {
  created_at: string;
  event_type: string;
  actor: "account" | "system";
  incident_id: string;
  details_json: string;
};

function detailsJsonForCsv(details: Record<string, unknown> | null, maxLen: number): string {
  if (!details || typeof details !== "object") {
    return "";
  }
  try {
    const s = JSON.stringify(details);
    if (s.length <= maxLen) return s;
    return `${s.slice(0, maxLen)}…`;
  } catch {
    return "";
  }
}

function mapCsvRow(r: {
  created_at: string;
  event_type: string;
  user_id: string | null;
  details: Record<string, unknown> | null;
}): SlackAuditCsvRow {
  return {
    created_at: r.created_at as string,
    event_type: r.event_type as string,
    actor: (r.user_id as string | null) ? "account" : "system",
    incident_id:
      incidentIdFromAuditDetails(
        r.event_type as string,
        (r.details as Record<string, unknown> | null) ?? null,
      ) ?? "",
    details_json: detailsJsonForCsv((r.details as Record<string, unknown> | null) ?? null, 8000),
  };
}

/** Slack delivery audit rows for CSV export (same filters as Audit Slack view; cap 100 rows). */
export async function listSlackAuditEntriesForCsvExport(
  userId: string | null,
  opts: AuditQueryOpts,
): Promise<SlackAuditCsvRow[]> {
  if (!hasSupabaseAuth() || !userId) {
    return [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await buildAuditExportQuery(supabase, userId, {
      ...opts,
      slackOnly: true,
    }).limit(100);

    if (error) {
      return [];
    }

    return (data ?? []).map(mapCsvRow);
  } catch {
    return [];
  }
}

export type AuditCsvRow = SlackAuditCsvRow;

/** All audit rows for CSV export (optional time window; cap 100 rows). */
export async function listAuditEntriesForCsvExport(
  userId: string | null,
  opts: AuditQueryOpts,
): Promise<AuditCsvRow[]> {
  if (!hasSupabaseAuth() || !userId) {
    return [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await buildAuditExportQuery(supabase, userId, opts).limit(100);

    if (error) {
      return [];
    }

    return (data ?? []).map(mapCsvRow);
  } catch {
    return [];
  }
}

/** Org-scoped audit events with timestamps for evidence freshness (cap 2000). */
export async function listAuditTimestampsForCompliance(
  userId: string,
  opts: {
    sinceIso?: string;
    orgId?: string | null;
    limit?: number;
    supabase?: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  },
): Promise<{ event_type: string; created_at: string }[]> {
  if (!hasSupabaseAuth() || !userId) return [];

  try {
    const supabase = opts.supabase ?? (await createServerSupabaseClient());
    let query = supabase
      .from("audit_log")
      .select("event_type, created_at")
      .order("created_at", { ascending: false });
    query = applyUserOrOrgScope(query, userId, opts.orgId);
    if (opts.sinceIso) {
      query = query.gte("created_at", opts.sinceIso);
    }
    const { data, error } = await query.limit(opts.limit ?? 2000);
    if (error) return [];
    return (data ?? []).map((r) => ({
      event_type: String(r.event_type),
      created_at: String(r.created_at),
    }));
  } catch {
    return [];
  }
}

/** Org-scoped audit scan for compliance summaries (cap 500). */
export async function listAuditEventTypesForCompliance(
  userId: string,
  opts: {
    sinceIso?: string;
    untilIso?: string;
    orgId?: string | null;
    supabase?: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  },
): Promise<{ event_type: string }[]> {
  if (!hasSupabaseAuth() || !userId) return [];

  try {
    const supabase = opts.supabase ?? (await createServerSupabaseClient());
    let query = supabase.from("audit_log").select("event_type").order("created_at", { ascending: false });
    query = applyUserOrOrgScope(query, userId, opts.orgId);
    if (opts.sinceIso) {
      query = query.gte("created_at", opts.sinceIso);
    }
    if (opts.untilIso) {
      query = query.lt("created_at", opts.untilIso);
    }
    const { data, error } = await query.limit(500);
    if (error) return [];
    return (data ?? []) as { event_type: string }[];
  } catch {
    return [];
  }
}
