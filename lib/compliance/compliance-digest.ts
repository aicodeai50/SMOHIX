import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildComplianceProgramDashboard,
  type ComplianceProgramDashboard,
} from "@/lib/compliance/program-dashboard";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const COMPLIANCE_DIGEST_VERSION = "zentro-compliance-digest/1";

export type ComplianceDigestSnapshot = {
  overallReadinessPercent: number;
  frameworks: {
    key: string;
    label: string;
    readinessPercent: number;
    exceptionCount: number;
  }[];
  attestations: {
    total: number;
    attested: number;
    pending: number;
    overdue: number;
  };
  overdueControlRefs: string[];
  soc2Trends: { improved: number; unchanged: number; regressed: number };
};

export type ComplianceDigestFrameworkDelta = {
  key: string;
  label: string;
  previousPercent: number | null;
  currentPercent: number;
  deltaPercent: number | null;
};

export type ComplianceDigestDeltas = {
  baseline: boolean;
  overallReadinessDelta: number | null;
  frameworks: ComplianceDigestFrameworkDelta[];
  soc2TrendsDelta: {
    improved: number | null;
    unchanged: number | null;
    regressed: number | null;
  };
  overdueDelta: number | null;
  newOverdueAttestations: {
    controlRef: string;
    title: string;
    dueAt: string;
    ownerLabel: string | null;
  }[];
};

export type ComplianceDigestPayload = {
  type: "zentro.compliance_digest.weekly";
  version: typeof COMPLIANCE_DIGEST_VERSION;
  orgId: string;
  generatedAt: string;
  periodDays: number;
  summary: {
    overallReadinessPercent: number;
    overdueAttestations: number;
    topGapCount: number;
    vendorCount: number;
  };
  deltas: ComplianceDigestDeltas;
  overdueAttestations: ComplianceProgramDashboard["overdueAttestations"];
  topGaps: ComplianceProgramDashboard["topGaps"];
  consoleUrl: string;
};

export type ComplianceDigestDeliveryRow = {
  id: string;
  orgId: string;
  periodDays: number;
  deliveryStatus: string;
  deliveryNote: string | null;
  createdAt: string;
};

export type RunComplianceDigestResult =
  | {
      ok: true;
      delivery: ComplianceDigestDeliveryRow;
      webhookDelivered: boolean;
      digest: ComplianceDigestPayload;
    }
  | { ok: false; reason: string };

const FRAMEWORK_LABELS: Record<string, string> = {
  soc2: "SOC 2 Type II",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nistCsf: "NIST CSF 2.0",
  cisV8: "CIS Controls v8",
  cmmcL2: "CMMC L2",
  gdprArt32: "GDPR Art. 32",
};

export function snapshotFromProgramDashboard(
  dashboard: ComplianceProgramDashboard,
): ComplianceDigestSnapshot {
  return {
    overallReadinessPercent: dashboard.overallReadinessPercent,
    frameworks: [
      { key: "soc2", label: FRAMEWORK_LABELS.soc2, readinessPercent: dashboard.soc2.readinessPercent, exceptionCount: dashboard.soc2.exceptionCount },
      {
        key: "iso27001",
        label: FRAMEWORK_LABELS.iso27001,
        readinessPercent: dashboard.iso27001.readinessPercent,
        exceptionCount: dashboard.iso27001.exceptionCount,
      },
      {
        key: "pcidss",
        label: FRAMEWORK_LABELS.pcidss,
        readinessPercent: dashboard.pcidss.readinessPercent,
        exceptionCount: dashboard.pcidss.exceptionCount,
      },
      {
        key: "hipaa",
        label: FRAMEWORK_LABELS.hipaa,
        readinessPercent: dashboard.hipaa.readinessPercent,
        exceptionCount: dashboard.hipaa.exceptionCount,
      },
      {
        key: "nistCsf",
        label: FRAMEWORK_LABELS.nistCsf,
        readinessPercent: dashboard.nistCsf.readinessPercent,
        exceptionCount: dashboard.nistCsf.exceptionCount,
      },
      {
        key: "cisV8",
        label: FRAMEWORK_LABELS.cisV8,
        readinessPercent: dashboard.cisV8.readinessPercent,
        exceptionCount: dashboard.cisV8.exceptionCount,
      },
      {
        key: "cmmcL2",
        label: FRAMEWORK_LABELS.cmmcL2,
        readinessPercent: dashboard.cmmcL2.readinessPercent,
        exceptionCount: dashboard.cmmcL2.exceptionCount,
      },
      {
        key: "gdprArt32",
        label: FRAMEWORK_LABELS.gdprArt32,
        readinessPercent: dashboard.gdprArt32.readinessPercent,
        exceptionCount: dashboard.gdprArt32.exceptionCount,
      },
    ],
    attestations: { ...dashboard.attestations },
    overdueControlRefs: dashboard.overdueAttestations.map((a) => a.controlRef),
    soc2Trends: { ...dashboard.soc2.trends },
  };
}

export function computeComplianceDigestDeltas(
  previous: ComplianceDigestSnapshot | null,
  current: ComplianceDigestSnapshot,
  overdueDetails: ComplianceProgramDashboard["overdueAttestations"],
): ComplianceDigestDeltas {
  if (!previous) {
    return {
      baseline: true,
      overallReadinessDelta: null,
      frameworks: current.frameworks.map((f) => ({
        key: f.key,
        label: f.label,
        previousPercent: null,
        currentPercent: f.readinessPercent,
        deltaPercent: null,
      })),
      soc2TrendsDelta: { improved: null, unchanged: null, regressed: null },
      overdueDelta: null,
      newOverdueAttestations: overdueDetails,
    };
  }

  const prevByKey = new Map(previous.frameworks.map((f) => [f.key, f]));
  const prevOverdue = new Set(previous.overdueControlRefs);

  return {
    baseline: false,
    overallReadinessDelta:
      Math.round((current.overallReadinessPercent - previous.overallReadinessPercent) * 10) / 10,
    frameworks: current.frameworks.map((f) => {
      const prev = prevByKey.get(f.key);
      const previousPercent = prev?.readinessPercent ?? null;
      const deltaPercent =
        previousPercent === null
          ? null
          : Math.round((f.readinessPercent - previousPercent) * 10) / 10;
      return {
        key: f.key,
        label: f.label,
        previousPercent,
        currentPercent: f.readinessPercent,
        deltaPercent,
      };
    }),
    soc2TrendsDelta: {
      improved: current.soc2Trends.improved - previous.soc2Trends.improved,
      unchanged: current.soc2Trends.unchanged - previous.soc2Trends.unchanged,
      regressed: current.soc2Trends.regressed - previous.soc2Trends.regressed,
    },
    overdueDelta: current.attestations.overdue - previous.attestations.overdue,
    newOverdueAttestations: overdueDetails.filter((a) => !prevOverdue.has(a.controlRef)),
  };
}

export function buildComplianceDigestPayload(
  orgId: string,
  dashboard: ComplianceProgramDashboard,
  deltas: ComplianceDigestDeltas,
  siteOrigin: string,
): ComplianceDigestPayload {
  const origin = siteOrigin.replace(/\/$/, "");
  return {
    type: "zentro.compliance_digest.weekly",
    version: COMPLIANCE_DIGEST_VERSION,
    orgId,
    generatedAt: dashboard.generatedAt,
    periodDays: dashboard.periodDays,
    summary: {
      overallReadinessPercent: dashboard.overallReadinessPercent,
      overdueAttestations: dashboard.attestations.overdue,
      topGapCount: dashboard.topGaps.length,
      vendorCount: dashboard.vendors.count,
    },
    deltas,
    overdueAttestations: dashboard.overdueAttestations,
    topGaps: dashboard.topGaps,
    consoleUrl: `${origin}/governance/compliance/program`,
  };
}

export async function deliverHttpsJsonWebhook(
  webhookUrl: string,
  payload: unknown,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const trimmed = webhookUrl.trim();
  if (!trimmed.startsWith("https://")) {
    return { ok: false, reason: "Webhook URL must use HTTPS." };
  }

  try {
    const res = await fetch(trimmed, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

export async function deliverComplianceDigestWebhook(
  webhookUrl: string,
  payload: ComplianceDigestPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  return deliverHttpsJsonWebhook(webhookUrl, payload);
}

function mapDeliveryRow(r: Record<string, unknown>): ComplianceDigestDeliveryRow {
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    periodDays: Number(r.period_days),
    deliveryStatus: String(r.delivery_status),
    deliveryNote: (r.delivery_note as string | null) ?? null,
    createdAt: String(r.created_at),
  };
}

export async function getLatestDigestSnapshot(
  orgId: string,
  opts?: { supabase?: SupabaseClient },
): Promise<ComplianceDigestSnapshot | null> {
  if (!hasSupabaseAuth() || !orgId) return null;

  try {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const { data } = await supabase
      .from("compliance_digest_deliveries")
      .select("snapshot_json")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data?.snapshot_json) return null;
    return data.snapshot_json as ComplianceDigestSnapshot;
  } catch {
    return null;
  }
}

export async function listComplianceDigestDeliveries(
  orgId: string,
  opts?: { limit?: number; supabase?: SupabaseClient },
): Promise<ComplianceDigestDeliveryRow[]> {
  if (!hasSupabaseAuth() || !orgId) return [];

  try {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const { data } = await supabase
      .from("compliance_digest_deliveries")
      .select("id, org_id, period_days, delivery_status, delivery_note, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 12);

    return (data ?? []).map((r) => mapDeliveryRow(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function runComplianceDigestForOrg(
  userId: string,
  orgId: string,
  opts: {
    periodDays?: number;
    siteOrigin: string;
    supabase?: SupabaseClient;
    scheduled?: boolean;
  },
): Promise<RunComplianceDigestResult> {
  if (!hasSupabaseAuth() || !userId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const dashboard = await buildComplianceProgramDashboard(userId, {
    orgId,
    periodDays,
    supabase,
  });
  if (!dashboard) {
    return { ok: false, reason: "Could not build program dashboard." };
  }

  const snapshot = snapshotFromProgramDashboard(dashboard);
  const previous = await getLatestDigestSnapshot(orgId, { supabase });
  const deltas = computeComplianceDigestDeltas(previous, snapshot, dashboard.overdueAttestations);
  const digest = buildComplianceDigestPayload(orgId, dashboard, deltas, opts.siteOrigin);

  let deliveryStatus = "stored";
  let deliveryNote: string | null = null;
  let webhookDelivered = false;

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("compliance_digest_webhook_url")
    .eq("id", orgId)
    .maybeSingle();

  const webhookUrl = String(orgRow?.compliance_digest_webhook_url ?? "").trim();

  if (webhookUrl) {
    const delivery = await deliverComplianceDigestWebhook(webhookUrl, digest);
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
      ? "No compliance_digest_webhook_url configured on organization."
      : "Digest stored; configure webhook URL to enable HTTPS delivery.";
  }

  const { data, error } = await supabase
    .from("compliance_digest_deliveries")
    .insert({
      org_id: orgId,
      created_by: userId,
      period_days: periodDays,
      snapshot_json: snapshot,
      digest_json: digest,
      delivery_status: deliveryStatus,
      delivery_note: deliveryNote,
    })
    .select("id, org_id, period_days, delivery_status, delivery_note, created_at")
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "Could not persist digest delivery." };
  }

  return {
    ok: true,
    delivery: mapDeliveryRow(data as Record<string, unknown>),
    webhookDelivered,
    digest,
  };
}
