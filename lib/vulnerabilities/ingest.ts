import { resolveAlertIngestUserId } from "@/lib/integrations/alert-ingest";
import { resolvePrimaryOrgIdForUser } from "@/lib/org/resolve-ingest-org";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

import { rollUpVulnerabilityFindingToPenTest } from "@/lib/pentest/rollup-db";
import {
  normalizeVulnerabilityPayload,
  type NormalizedVulnerabilityFinding,
} from "@/lib/vulnerabilities/normalize";

export { resolveAlertIngestUserId };

export async function ingestVulnerabilityFinding(
  userId: string,
  tokenId: string,
  raw: unknown,
  sourceHint?: string | null,
  options?: { penTestEngagementId?: string | null },
): Promise<
  | {
      ok: true;
      findingId: string;
      incidentId: string | null;
      duplicate: boolean;
      openedIncident: boolean;
      penTestEngagementId: string | null;
      penTestRolledUp: boolean;
    }
  | { ok: false; status: number; message: string }
> {
  const normalized = normalizeVulnerabilityPayload(raw, sourceHint);
  if (!normalized) {
    return {
      ok: false,
      status: 400,
      message: "Could not parse vulnerability payload (need finding id / QID / plugin id).",
    };
  }

  const admin = createServiceSupabaseClient();
  if (!admin) {
    return { ok: false, status: 503, message: "Vulnerability ingest is not configured." };
  }

  const upsertResult = await upsertFinding(admin, userId, normalized, raw);
  if (!upsertResult.ok) {
    return upsertResult;
  }

  let incidentId = upsertResult.incidentId;
  let openedIncident = false;

  if (
    !incidentId &&
    (normalized.severity === "critical" || normalized.severity === "high")
  ) {
    const incidentResult = await openIncidentForFinding(admin, userId, normalized);
    if (incidentResult.ok) {
      incidentId = incidentResult.incidentId;
      openedIncident = incidentResult.opened;
      if (incidentId) {
        await admin
          .from("vulnerability_findings")
          .update({ incident_id: incidentId })
          .eq("id", upsertResult.findingId);
      }
    }
  }

  const rollup = await rollUpVulnerabilityFindingToPenTest(admin, userId, {
    findingId: upsertResult.findingId,
    normalized,
    isNewFinding: !upsertResult.duplicate,
    forcedEngagementId: options?.penTestEngagementId ?? null,
  });

  await admin
    .from("alert_ingest_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenId);

  return {
    ok: true,
    findingId: upsertResult.findingId,
    incidentId,
    duplicate: upsertResult.duplicate,
    openedIncident,
    penTestEngagementId: rollup.engagementId,
    penTestRolledUp: rollup.rolledUp,
  };
}

async function upsertFinding(
  admin: NonNullable<ReturnType<typeof createServiceSupabaseClient>>,
  userId: string,
  normalized: NormalizedVulnerabilityFinding,
  raw: unknown,
): Promise<
  | { ok: true; findingId: string; incidentId: string | null; duplicate: boolean }
  | { ok: false; status: number; message: string }
> {
  const { data: existing } = await admin
    .from("vulnerability_findings")
    .select("id, incident_id")
    .eq("user_id", userId)
    .eq("scanner", normalized.scanner)
    .eq("external_id", normalized.externalId)
    .maybeSingle();

  const row = {
    user_id: userId,
    scanner: normalized.scanner,
    external_id: normalized.externalId,
    title: normalized.title,
    severity: normalized.severity,
    cvss_score: normalized.cvssScore,
    asset_host: normalized.assetHost,
    cve_id: normalized.cveId,
    raw_payload: raw as object,
    detected_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin
      .from("vulnerability_findings")
      .update({
        title: row.title,
        severity: row.severity,
        cvss_score: row.cvss_score,
        asset_host: row.asset_host,
        cve_id: row.cve_id,
        raw_payload: row.raw_payload,
        detected_at: row.detected_at,
      })
      .eq("id", existing.id);

    if (error) {
      return { ok: false, status: 400, message: error.message };
    }

    return {
      ok: true,
      findingId: existing.id as string,
      incidentId: (existing.incident_id as string | null) ?? null,
      duplicate: true,
    };
  }

  const { data: inserted, error: insertError } = await admin
    .from("vulnerability_findings")
    .insert(row)
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    return {
      ok: false,
      status: 400,
      message: insertError?.message ?? "Insert failed.",
    };
  }

  return {
    ok: true,
    findingId: inserted.id as string,
    incidentId: null,
    duplicate: false,
  };
}

async function openIncidentForFinding(
  admin: NonNullable<ReturnType<typeof createServiceSupabaseClient>>,
  userId: string,
  normalized: NormalizedVulnerabilityFinding,
): Promise<{ ok: true; incidentId: string | null; opened: boolean }> {
  const orgId = await resolvePrimaryOrgIdForUser(userId);
  const externalRef = `vuln:${normalized.scanner}:${normalized.externalId}`.slice(0, 500);

  let existingQuery = admin.from("incidents").select("id").eq("external_ref", externalRef);
  if (orgId) {
    existingQuery = existingQuery.eq("org_id", orgId);
  } else {
    existingQuery = existingQuery.eq("user_id", userId);
  }
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing?.id) {
    return { ok: true, incidentId: existing.id as string, opened: false };
  }

  const summaryParts = [
    normalized.summary,
    normalized.cveId ? `CVE: ${normalized.cveId}` : null,
    normalized.assetHost ? `asset: ${normalized.assetHost}` : null,
    normalized.cvssScore != null ? `CVSS: ${normalized.cvssScore}` : null,
  ].filter(Boolean);

  const { data: inserted, error } = await admin
    .from("incidents")
    .insert({
      user_id: userId,
      title: `[Vuln] ${normalized.title}`.slice(0, 500),
      severity: normalized.severity,
      status: "investigating",
      external_ref: externalRef,
      postmortem: summaryParts.join("\n").slice(0, 12000) || null,
      ...(orgId ? { org_id: orgId } : {}),
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    return { ok: true, incidentId: null, opened: false };
  }

  return { ok: true, incidentId: inserted.id as string, opened: true };
}
