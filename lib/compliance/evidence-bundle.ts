import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildComplianceEvidencePack,
  complianceEvidencePackToCsv,
  type ComplianceEvidencePack,
} from "@/lib/compliance/export";
import {
  buildTamperEvidentManifest,
  verifyEvidenceBundleManifest,
  type EvidenceBundleManifest,
} from "@/lib/compliance/manifest";
import { auditSinceIsoFromWindow, auditWindowToSinceIso } from "@/lib/audit/export-window";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type EvidenceBundleRow = {
  id: string;
  orgId: string;
  windowLabel: string;
  sinceIso: string | null;
  manifestSha256: string;
  manifest: EvidenceBundleManifest;
  storageUri: string;
  deliveryStatus: string;
  deliveryNote: string | null;
  createdAt: string;
  createdBy: string;
};

export type CreateEvidenceBundleResult =
  | {
      ok: true;
      bundle: EvidenceBundleRow;
      webhookDelivered: boolean;
    }
  | { ok: false; reason: string };

function mapRow(r: Record<string, unknown>): EvidenceBundleRow {
  const manifest = r.manifest_json as EvidenceBundleManifest;
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    windowLabel: String(r.window_label),
    sinceIso: (r.since_iso as string | null) ?? null,
    manifestSha256: String(r.manifest_sha256),
    manifest,
    storageUri: String(r.storage_uri),
    deliveryStatus: String(r.delivery_status),
    deliveryNote: (r.delivery_note as string | null) ?? null,
    createdAt: String(r.created_at),
    createdBy: String(r.created_by),
  };
}

export function bundleStorageUri(orgId: string, bundleId: string): string {
  return `zentro://compliance-bundles/${orgId}/${bundleId}`;
}

export async function deliverBundleWebhook(
  webhookUrl: string,
  payload: {
    manifest: EvidenceBundleManifest;
    storageUri: string;
    downloadUrls: { json: string; csv: string };
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const trimmed = webhookUrl.trim();
  if (!trimmed.startsWith("https://")) {
    return { ok: false, reason: "Webhook URL must use HTTPS." };
  }

  try {
    const res = await fetch(trimmed, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "zentro.evidence_bundle.created",
        ...payload,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { ok: false, reason: `Webhook returned ${res.status}.` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook request failed.";
    return { ok: false, reason: msg };
  }
}

export async function createEvidenceBundle(
  userId: string,
  orgId: string,
  opts: {
    windowParam?: string | null;
    siteOrigin: string;
    supabase?: SupabaseClient;
  },
): Promise<CreateEvidenceBundleResult> {
  if (!hasSupabaseAuth() || !userId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const windowNorm = auditWindowToSinceIso(opts.windowParam ?? "30d");
  const sinceIso = auditSinceIsoFromWindow(windowNorm);

  const pack = await buildComplianceEvidencePack(userId, {
    sinceIso,
    windowLabel: windowNorm,
    orgId,
    supabase: opts.supabase,
  });
  if (!pack) {
    return { ok: false, reason: "Could not build evidence pack." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const bundleId = crypto.randomUUID();
  const manifest = buildTamperEvidentManifest(bundleId, orgId, pack);
  if (!verifyEvidenceBundleManifest(manifest)) {
    return { ok: false, reason: "Manifest integrity check failed." };
  }

  const storageUri = bundleStorageUri(orgId, bundleId);
  let deliveryStatus: EvidenceBundleRow["deliveryStatus"] = "stored";
  let deliveryNote: string | null = null;
  let webhookDelivered = false;

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("evidence_bundle_webhook_url")
    .eq("id", orgId)
    .maybeSingle();

  const webhookUrl = String(orgRow?.evidence_bundle_webhook_url ?? "").trim();
  const downloadBase = `${opts.siteOrigin.replace(/\/$/, "")}/api/governance/compliance/bundles/${bundleId}`;

  if (webhookUrl) {
    const delivery = await deliverBundleWebhook(webhookUrl, {
      manifest,
      storageUri,
      downloadUrls: {
        json: `${downloadBase}/download?format=json`,
        csv: `${downloadBase}/download?format=csv`,
      },
    });
    if (delivery.ok) {
      deliveryStatus = "webhook_sent";
      webhookDelivered = true;
    } else {
      deliveryStatus = "webhook_failed";
      deliveryNote = delivery.reason.slice(0, 500);
    }
  } else {
    deliveryStatus = "webhook_skipped";
    deliveryNote = "No evidence_bundle_webhook_url configured on organization.";
  }

  const { data, error } = await supabase
    .from("compliance_evidence_bundles")
    .insert({
      id: bundleId,
      org_id: orgId,
      created_by: userId,
      window_label: windowNorm,
      since_iso: sinceIso,
      manifest_sha256: manifest.manifestSha256,
      manifest_json: manifest,
      pack_json: pack,
      storage_uri: storageUri,
      delivery_status: deliveryStatus,
      delivery_note: deliveryNote,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "Could not persist bundle." };
  }

  return {
    ok: true,
    bundle: mapRow(data as Record<string, unknown>),
    webhookDelivered,
  };
}

export async function listEvidenceBundlesForOrg(
  orgId: string,
  opts?: { limit?: number; supabase?: SupabaseClient },
): Promise<EvidenceBundleRow[]> {
  if (!hasSupabaseAuth() || !orgId) return [];

  try {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const { data } = await supabase
      .from("compliance_evidence_bundles")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 20);

    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getEvidenceBundleForOrg(
  bundleId: string,
  orgId: string,
  opts?: { supabase?: SupabaseClient },
): Promise<{ row: EvidenceBundleRow; pack: ComplianceEvidencePack } | null> {
  if (!hasSupabaseAuth() || !bundleId || !orgId) return null;

  try {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const { data } = await supabase
      .from("compliance_evidence_bundles")
      .select("*")
      .eq("id", bundleId)
      .eq("org_id", orgId)
      .maybeSingle();

    if (!data) return null;
    const row = mapRow(data as Record<string, unknown>);
    const pack = data.pack_json as ComplianceEvidencePack;
    if (!verifyEvidenceBundleManifest(row.manifest)) {
      return null;
    }
    return { row, pack };
  } catch {
    return null;
  }
}

export function packToDownloadBody(
  pack: ComplianceEvidencePack,
  format: "json" | "csv",
): { body: string; mediaType: string; filename: string } {
  if (format === "csv") {
    return {
      body: complianceEvidencePackToCsv(pack),
      mediaType: "text/csv; charset=utf-8",
      filename: `compliance-bundle-${pack.windowLabel}.csv`,
    };
  }
  return {
    body: JSON.stringify(pack, null, 2),
    mediaType: "application/json; charset=utf-8",
    filename: `compliance-bundle-${pack.windowLabel}.json`,
  };
}
