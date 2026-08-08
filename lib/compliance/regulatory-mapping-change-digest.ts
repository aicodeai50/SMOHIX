import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { COMPLIANCE_CONTROLS } from "@/lib/compliance/catalog";
import { deliverHttpsJsonWebhook } from "@/lib/compliance/compliance-digest";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmailWithAudit,
} from "@/lib/notifications/email";
import { REGULATORY_CHANGE_CATALOG_VERSION } from "@/lib/compliance/regulatory-change-impact";
import { SOC2_ISO_CROSSWALK_LINKS } from "@/lib/compliance/soc2-iso-crosswalk";
import { listOrgMembers } from "@/lib/org/data";
import { MEMBER_ADMIN_ROLES } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const REGULATORY_MAPPING_DIGEST_VERSION = "smohix-regulatory-mapping-digest/1";

export const COMPLIANCE_CATALOG_RELEASE = "smohix-compliance-catalog/2026.05";

export type MappingSnapshot = {
  catalogRelease: string;
  regulatoryCatalogVersion: string;
  controlIds: string[];
  crosswalkKeys: string[];
  catalogFingerprint: string;
  crosswalkFingerprint: string;
};

export type MappingChangeItem = {
  kind:
    | "control_added"
    | "control_removed"
    | "crosswalk_added"
    | "crosswalk_removed"
    | "catalog_release_changed"
    | "regulatory_catalog_changed";
  id: string;
  label: string;
  detail: string;
};

export type MappingChangeDigestDeltas = {
  baseline: boolean;
  changeCount: number;
  changes: MappingChangeItem[];
};

export type RegulatoryMappingDigestPayload = {
  type: "smohix.regulatory_mapping_digest";
  version: typeof REGULATORY_MAPPING_DIGEST_VERSION;
  orgId: string;
  generatedAt: string;
  summary: {
    controlCount: number;
    crosswalkLinkCount: number;
    catalogRelease: string;
    regulatoryCatalogVersion: string;
    changeCount: number;
  };
  deltas: MappingChangeDigestDeltas;
  consoleUrl: string;
  crosswalkUrl: string;
  regulatoryImpactUrl: string;
};

export type MappingDigestDeliveryRow = {
  id: string;
  orgId: string;
  changeCount: number;
  deliveryStatus: string;
  deliveryNote: string | null;
  createdAt: string;
};

export type RunMappingDigestResult =
  | {
      ok: true;
      delivery: MappingDigestDeliveryRow;
      webhookDelivered: boolean;
      emailsSent: number;
      digest: RegulatoryMappingDigestPayload;
    }
  | { ok: false; reason: string };

function sha256Canonical(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function crosswalkKey(soc2Id: string, isoId: string, strength: string): string {
  return `${soc2Id}::${isoId}::${strength}`;
}

export function buildCurrentMappingSnapshot(): MappingSnapshot {
  const controlIds = COMPLIANCE_CONTROLS.map((c) => c.id).sort();
  const crosswalkKeys = SOC2_ISO_CROSSWALK_LINKS.map((l) =>
    crosswalkKey(l.soc2Id, l.isoId, l.strength),
  ).sort();

  return {
    catalogRelease: COMPLIANCE_CATALOG_RELEASE,
    regulatoryCatalogVersion: REGULATORY_CHANGE_CATALOG_VERSION,
    controlIds,
    crosswalkKeys,
    catalogFingerprint: sha256Canonical(controlIds.join("\n")),
    crosswalkFingerprint: sha256Canonical(crosswalkKeys.join("\n")),
  };
}

export function computeMappingChanges(
  previous: MappingSnapshot | null,
  current: MappingSnapshot,
): MappingChangeDigestDeltas {
  if (!previous) {
    return {
      baseline: true,
      changeCount: 0,
      changes: [],
    };
  }

  const changes: MappingChangeItem[] = [];

  if (previous.catalogRelease !== current.catalogRelease) {
    changes.push({
      kind: "catalog_release_changed",
      id: "catalog-release",
      label: "Compliance catalog release",
      detail: `${previous.catalogRelease} → ${current.catalogRelease}`,
    });
  }

  if (previous.regulatoryCatalogVersion !== current.regulatoryCatalogVersion) {
    changes.push({
      kind: "regulatory_catalog_changed",
      id: "regulatory-catalog",
      label: "Regulatory scenario catalog",
      detail: `${previous.regulatoryCatalogVersion} → ${current.regulatoryCatalogVersion}`,
    });
  }

  const prevControls = new Set(previous.controlIds);
  const curControls = new Set(current.controlIds);

  for (const id of current.controlIds) {
    if (!prevControls.has(id)) {
      const c = COMPLIANCE_CONTROLS.find((row) => row.id === id);
      changes.push({
        kind: "control_added",
        id,
        label: c ? `${c.ref} — ${c.title}` : id,
        detail: `New catalog control (${c?.framework ?? "unknown"})`,
      });
    }
  }

  for (const id of previous.controlIds) {
    if (!curControls.has(id)) {
      changes.push({
        kind: "control_removed",
        id,
        label: id,
        detail: "Control removed from Smohix catalog",
      });
    }
  }

  const prevX = new Set(previous.crosswalkKeys);
  const curX = new Set(current.crosswalkKeys);

  for (const key of current.crosswalkKeys) {
    if (!prevX.has(key)) {
      const [soc2Id, isoId, strength] = key.split("::");
      changes.push({
        kind: "crosswalk_added",
        id: key,
        label: `${soc2Id} ↔ ${isoId}`,
        detail: `New crosswalk link (${strength})`,
      });
    }
  }

  for (const key of previous.crosswalkKeys) {
    if (!curX.has(key)) {
      changes.push({
        kind: "crosswalk_removed",
        id: key,
        label: key.replace(/::/g, " ↔ "),
        detail: "Crosswalk link removed",
      });
    }
  }

  return {
    baseline: false,
    changeCount: changes.length,
    changes,
  };
}

export function buildRegulatoryMappingDigestPayload(
  orgId: string,
  snapshot: MappingSnapshot,
  deltas: MappingChangeDigestDeltas,
  siteOrigin: string,
): RegulatoryMappingDigestPayload {
  const origin = siteOrigin.replace(/\/$/, "");
  return {
    type: "smohix.regulatory_mapping_digest",
    version: REGULATORY_MAPPING_DIGEST_VERSION,
    orgId,
    generatedAt: new Date().toISOString(),
    summary: {
      controlCount: snapshot.controlIds.length,
      crosswalkLinkCount: snapshot.crosswalkKeys.length,
      catalogRelease: snapshot.catalogRelease,
      regulatoryCatalogVersion: snapshot.regulatoryCatalogVersion,
      changeCount: deltas.changeCount,
    },
    deltas,
    consoleUrl: `${origin}/governance/compliance/mapping-digest`,
    crosswalkUrl: `${origin}/governance/compliance/crosswalk`,
    regulatoryImpactUrl: `${origin}/governance/compliance/regulatory-impact`,
  };
}

function mapDeliveryRow(r: Record<string, unknown>): MappingDigestDeliveryRow {
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    changeCount: Number(r.change_count ?? 0),
    deliveryStatus: String(r.delivery_status),
    deliveryNote: (r.delivery_note as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export async function getLatestMappingSnapshot(
  orgId: string,
  opts?: { supabase?: SupabaseClient },
): Promise<MappingSnapshot | null> {
  if (!hasSupabaseAuth() || !orgId) return null;

  try {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const { data } = await supabase
      .from("compliance_mapping_digest_deliveries")
      .select("snapshot_json")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data?.snapshot_json) return null;
    return data.snapshot_json as MappingSnapshot;
  } catch {
    return null;
  }
}

export async function listMappingDigestDeliveries(
  orgId: string,
  opts?: { limit?: number; supabase?: SupabaseClient },
): Promise<MappingDigestDeliveryRow[]> {
  if (!hasSupabaseAuth() || !orgId) return [];

  try {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const { data } = await supabase
      .from("compliance_mapping_digest_deliveries")
      .select("id, org_id, change_count, delivery_status, delivery_note, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 12);

    return (data ?? []).map((r) => mapDeliveryRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

function mappingDigestEmailBody(payload: RegulatoryMappingDigestPayload): string {
  const lines = [
    "Smohix regulatory mapping change digest",
    "",
    `Changes detected: ${payload.summary.changeCount}`,
    `Catalog controls: ${payload.summary.controlCount}`,
    `SOC 2 ↔ ISO crosswalk links: ${payload.summary.crosswalkLinkCount}`,
    `Catalog release: ${payload.summary.catalogRelease}`,
    `Regulatory scenario catalog: ${payload.summary.regulatoryCatalogVersion}`,
    "",
  ];

  if (payload.deltas.changes.length === 0) {
    lines.push("Baseline snapshot recorded (no prior mapping fingerprint).");
  } else {
    for (const c of payload.deltas.changes.slice(0, 25)) {
      lines.push(`• [${c.kind}] ${c.label} — ${c.detail}`);
    }
    if (payload.deltas.changes.length > 25) {
      lines.push(`… and ${payload.deltas.changes.length - 25} more`);
    }
  }

  lines.push("", `Console: ${payload.consoleUrl}`);
  return lines.join("\n");
}

export async function sendMappingDigestEmails(
  orgId: string,
  actorUserId: string,
  payload: RegulatoryMappingDigestPayload,
  supabase: SupabaseClient,
): Promise<{ sent: number; skipped: number }> {
  if (!isTransactionalEmailConfigured()) {
    return { sent: 0, skipped: 0 };
  }

  const members = await listOrgMembers(orgId, { supabase });
  const recipients = members.filter((m) => MEMBER_ADMIN_ROLES.includes(m.role) && m.email);

  let sent = 0;
  let skipped = 0;
  const subject =
    payload.deltas.changeCount > 0
      ? `[Smohix] ${payload.deltas.changeCount} compliance mapping change(s)`
      : "[Smohix] Compliance mapping baseline recorded";

  const body = mappingDigestEmailBody(payload);

  for (const m of recipients) {
    if (!m.email) {
      skipped += 1;
      continue;
    }
    const result = await sendTransactionalEmailWithAudit({
      to: m.email,
      subject,
      text: body,
      userId: actorUserId,
      orgId,
      auditDetails: {
        event: "governance.regulatory_mapping_digest_emailed",
        change_count: payload.deltas.changeCount,
        recipient_role: m.role,
      },
    });
    if (result.ok) sent += 1;
    else skipped += 1;
  }

  return { sent, skipped };
}

export async function runRegulatoryMappingDigestForOrg(
  userId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    supabase?: SupabaseClient;
    scheduled?: boolean;
    forceNotify?: boolean;
  },
): Promise<RunMappingDigestResult> {
  if (!hasSupabaseAuth() || !userId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const current = buildCurrentMappingSnapshot();
  const previous = await getLatestMappingSnapshot(orgId, { supabase });
  const deltas = computeMappingChanges(previous, current);
  const digest = buildRegulatoryMappingDigestPayload(orgId, current, deltas, opts.siteOrigin);

  const hasChanges = deltas.changeCount > 0;
  const shouldNotify = opts.forceNotify || hasChanges || deltas.baseline;

  let deliveryStatus = shouldNotify ? "stored" : "no_changes";
  let deliveryNote: string | null = null;
  let webhookDelivered = false;
  let emailsSent = 0;

  const { data: orgRow } = await supabase
    .from("organizations")
    .select(
      "compliance_mapping_digest_webhook_url, compliance_mapping_digest_email_enabled",
    )
    .eq("id", orgId)
    .maybeSingle();

  const webhookUrl = String(orgRow?.compliance_mapping_digest_webhook_url ?? "").trim();
  const emailEnabled = Boolean(orgRow?.compliance_mapping_digest_email_enabled);

  if (shouldNotify) {
    if (webhookUrl) {
      const delivery = await deliverHttpsJsonWebhook(webhookUrl, digest);
      if (delivery.ok) {
        deliveryStatus = "webhook_sent";
        webhookDelivered = true;
      } else {
        deliveryStatus = "webhook_failed";
        deliveryNote = delivery.reason.slice(0, 500);
      }
    } else {
      deliveryStatus = "webhook_skipped";
      deliveryNote = opts.scheduled
        ? "No compliance_mapping_digest_webhook_url configured."
        : "Configure mapping digest webhook to enable HTTPS delivery.";
    }

    if (emailEnabled && (hasChanges || deltas.baseline)) {
      const emailResult = await sendMappingDigestEmails(orgId, userId, digest, supabase);
      emailsSent = emailResult.sent;
      if (emailsSent > 0 && deliveryStatus === "webhook_skipped") {
        deliveryStatus = "email_sent";
      } else if (emailsSent > 0 && deliveryStatus === "webhook_sent") {
        deliveryNote = [deliveryNote, `Email sent to ${emailsSent} admin(s).`]
          .filter(Boolean)
          .join(" ");
      } else if (emailEnabled && emailsSent === 0 && !webhookDelivered) {
        deliveryStatus = "email_failed";
        deliveryNote = "Email enabled but no messages sent (check SMOHIX_RESEND_API_KEY).";
      }
    }
  } else {
    deliveryNote = "No mapping changes since last snapshot.";
  }

  const { data, error } = await supabase
    .from("compliance_mapping_digest_deliveries")
    .insert({
      org_id: orgId,
      created_by: userId,
      snapshot_json: current,
      digest_json: digest,
      change_count: deltas.changeCount,
      delivery_status: deliveryStatus,
      delivery_note: deliveryNote,
    })
    .select("id, org_id, change_count, delivery_status, delivery_note, created_at")
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "Could not persist mapping digest." };
  }

  return {
    ok: true,
    delivery: mapDeliveryRow(data as Record<string, unknown>),
    webhookDelivered,
    emailsSent,
    digest,
  };
}

export function regulatoryMappingDigestToJson(pack: RegulatoryMappingDigestPayload): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}
