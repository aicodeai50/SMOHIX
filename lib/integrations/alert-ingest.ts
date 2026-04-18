import { hashApiKeyPlaintext } from "@/lib/api-keys/token";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import type { IncidentSeverity } from "@/lib/incidents/types";

const SEVERITIES = new Set<IncidentSeverity>(["low", "medium", "high", "critical"]);

const STATUSES = new Set([
  "investigating",
  "mitigated",
  "resolved",
  "monitoring",
]);

export type AlertIngestPayload = {
  title?: unknown;
  severity?: unknown;
  status?: unknown;
  summary?: unknown;
  service_id?: unknown;
  service_name?: unknown;
  dedupe_key?: unknown;
};

export async function resolveAlertIngestUserId(bearerPlain: string): Promise<
  | { ok: true; tokenId: string; userId: string }
  | { ok: false; status: number; message: string }
> {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return { ok: false, status: 503, message: "Alert ingest is not configured." };
  }

  const hash = hashApiKeyPlaintext(bearerPlain);
  const { data, error } = await admin
    .from("alert_ingest_tokens")
    .select("id, user_id")
    .eq("secret_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 401, message: "Invalid or revoked ingest token." };
  }

  return {
    ok: true,
    tokenId: data.id as string,
    userId: data.user_id as string,
  };
}

export async function ingestAlertCreateIncident(
  userId: string,
  tokenId: string,
  raw: AlertIngestPayload,
): Promise<
  { ok: true; id: string; duplicate: boolean } | { ok: false; status: number; message: string }
> {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return { ok: false, status: 503, message: "Alert ingest is not configured." };
  }

  const title =
    typeof raw.title === "string" ? raw.title.trim() : String(raw.title ?? "").trim();
  if (!title) {
    return { ok: false, status: 400, message: "Field `title` is required." };
  }

  const sevRaw = typeof raw.severity === "string" ? raw.severity.trim().toLowerCase() : "medium";
  const severity = SEVERITIES.has(sevRaw as IncidentSeverity)
    ? (sevRaw as IncidentSeverity)
    : "medium";

  const stRaw =
    typeof raw.status === "string" ? raw.status.trim().toLowerCase() : "investigating";
  const status = STATUSES.has(stRaw) ? stRaw : "investigating";

  const summary =
    typeof raw.summary === "string" ? raw.summary.trim().slice(0, 12000) : null;

  const dedupe =
    typeof raw.dedupe_key === "string" ? raw.dedupe_key.trim().slice(0, 500) : null;

  let serviceId: string | null =
    typeof raw.service_id === "string" && /^[0-9a-f-]{36}$/i.test(raw.service_id)
      ? raw.service_id
      : null;

  if (!serviceId && typeof raw.service_name === "string" && raw.service_name.trim()) {
    const sn = raw.service_name.trim().slice(0, 200);
    const { data: svc } = await admin
      .from("services")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", sn)
      .limit(1)
      .maybeSingle();
    if (svc?.id) {
      serviceId = svc.id as string;
    }
  }

  if (dedupe) {
    const { data: existing } = await admin
      .from("incidents")
      .select("id")
      .eq("user_id", userId)
      .eq("external_ref", dedupe)
      .maybeSingle();
    if (existing?.id) {
      await admin
        .from("alert_ingest_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", tokenId);
      return { ok: true, id: existing.id as string, duplicate: true };
    }
  }

  const insertRow: Record<string, unknown> = {
    user_id: userId,
    title: title.slice(0, 500),
    severity,
    status,
    postmortem: summary,
  };
  if (serviceId) insertRow.service_id = serviceId;
  if (dedupe) insertRow.external_ref = dedupe;

  const { data: inserted, error: insertError } = await admin
    .from("incidents")
    .insert(insertRow)
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505" && dedupe) {
      const { data: ex2 } = await admin
        .from("incidents")
        .select("id")
        .eq("user_id", userId)
        .eq("external_ref", dedupe)
        .maybeSingle();
      if (ex2?.id) {
        await admin
          .from("alert_ingest_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", tokenId);
        return { ok: true, id: ex2.id as string, duplicate: true };
      }
    }
    return { ok: false, status: 400, message: insertError.message };
  }

  if (!inserted?.id) {
    return { ok: false, status: 500, message: "Insert returned no incident id." };
  }

  await admin
    .from("alert_ingest_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenId);

  return { ok: true, id: inserted.id as string, duplicate: false };
}
