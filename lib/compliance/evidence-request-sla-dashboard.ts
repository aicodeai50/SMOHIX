import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildAssessorEvidenceRequestPackFromRows,
  listAssessorEvidenceRequests,
  type AssessorEvidenceRequestRow,
} from "@/lib/compliance/assessor-evidence-requests";
import { deliverHttpsJsonWebhook } from "@/lib/compliance/compliance-digest";
import type { ComplianceFramework } from "@/lib/compliance/types";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmailWithAudit,
} from "@/lib/notifications/email";
import { listOrgMembers } from "@/lib/org/data";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const EVIDENCE_REQUEST_SLA_DASHBOARD_VERSION = "zentro-evidence-request-sla-dashboard/1";

export type EvidenceRequestSlaBucket =
  | "on_track"
  | "at_risk"
  | "overdue"
  | "fulfilled_on_time"
  | "fulfilled_late"
  | "cancelled";

export type EvidenceRequestSlaQueueItem = {
  requestId: string;
  title: string;
  controlRef: string;
  frameworkLabel: string;
  status: AssessorEvidenceRequestRow["status"];
  slaBucket: EvidenceRequestSlaBucket;
  dueAt: string;
  daysUntilDue: number;
  daysOverdue: number;
  assignedToLabel: string | null;
  requestedByLabel: string;
  href: string;
};

export type AssigneeSlaSummary = {
  assigneeUserId: string | null;
  assigneeLabel: string;
  openCount: number;
  atRiskCount: number;
  overdueCount: number;
  fulfilledCount: number;
  onTimeRatePercent: number;
};

export type FrameworkSlaSummary = {
  framework: ComplianceFramework;
  label: string;
  openCount: number;
  overdueCount: number;
  fulfilledCount: number;
  onTimeRatePercent: number;
  href: string;
};

export type EvidenceRequestSlaDashboardPack = {
  version: typeof EVIDENCE_REQUEST_SLA_DASHBOARD_VERSION;
  generatedAt: string;
  orgId: string | null;
  atRiskDays: number;
  totalCount: number;
  openCount: number;
  overdueCount: number;
  atRiskCount: number;
  onTrackCount: number;
  fulfilledCount: number;
  cancelledCount: number;
  fulfillmentRatePercent: number;
  onTimeFulfillmentPercent: number;
  avgFulfillmentDays: number | null;
  overdueQueue: EvidenceRequestSlaQueueItem[];
  atRiskQueue: EvidenceRequestSlaQueueItem[];
  assigneeSummaries: AssigneeSlaSummary[];
  frameworkSummaries: FrameworkSlaSummary[];
  auditorDigestPreview: string;
};

export type EvidenceRequestSlaOrgSettings = {
  atRiskDays: number;
  digestEmailEnabled: boolean;
  digestWebhookUrl: string | null;
};

export type AuditorEvidenceRequestSlaDigest = {
  type: "zentro.evidence_request_sla_digest";
  version: typeof EVIDENCE_REQUEST_SLA_DASHBOARD_VERSION;
  orgId: string;
  generatedAt: string;
  summary: {
    open: number;
    overdue: number;
    atRisk: number;
    fulfillmentRatePercent: number;
    onTimeFulfillmentPercent: number;
  };
  overdue: EvidenceRequestSlaQueueItem[];
  atRisk: EvidenceRequestSlaQueueItem[];
  consoleUrl: string;
};

const FRAMEWORK_PATHS: Record<ComplianceFramework, string> = {
  soc2: "/governance/compliance/type-ii",
  iso27001: "/governance/compliance/iso-assessment",
  pcidss: "/governance/compliance/pci-dss",
  hipaa: "/governance/compliance/hipaa",
  nist_csf: "/governance/compliance/nist-csf",
  cis_v8: "/governance/compliance/cis-v8",
  cmmc_l2: "/governance/compliance/cmmc-l2",
  gdpr_art32: "/governance/compliance/gdpr-art32",
};

function daysUntil(iso: string, now = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}

function daysOverdue(iso: string, now = new Date()): number {
  const d = daysUntil(iso, now);
  return d < 0 ? Math.abs(d) : 0;
}

function computeFulfillmentDays(row: AssessorEvidenceRequestRow): number | null {
  if (!row.fulfilledAt) return null;
  const ms = new Date(row.fulfilledAt).getTime() - new Date(row.createdAt).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function classifyEvidenceRequestSla(
  row: AssessorEvidenceRequestRow,
  atRiskDays: number,
  now = new Date(),
): EvidenceRequestSlaBucket {
  if (row.storedStatus === "cancelled") return "cancelled";
  if (row.storedStatus === "fulfilled") {
    if (row.fulfilledAt && new Date(row.fulfilledAt).getTime() <= new Date(row.dueAt).getTime()) {
      return "fulfilled_on_time";
    }
    return "fulfilled_late";
  }
  const until = daysUntil(row.dueAt, now);
  if (until < 0) return "overdue";
  if (until <= atRiskDays) return "at_risk";
  return "on_track";
}

export function toSlaQueueItem(
  row: AssessorEvidenceRequestRow,
  bucket: EvidenceRequestSlaBucket,
  now = new Date(),
): EvidenceRequestSlaQueueItem {
  return {
    requestId: row.id,
    title: row.title,
    controlRef: row.controlRef,
    frameworkLabel: row.frameworkLabel,
    status: row.status,
    slaBucket: bucket,
    dueAt: row.dueAt,
    daysUntilDue: daysUntil(row.dueAt, now),
    daysOverdue: daysOverdue(row.dueAt, now),
    assignedToLabel: row.assignedToLabel,
    requestedByLabel: row.requestedByLabel,
    href: "/governance/compliance/evidence-requests",
  };
}

export function buildAssigneeSlaSummaries(
  rows: AssessorEvidenceRequestRow[],
  atRiskDays: number,
  now = new Date(),
): AssigneeSlaSummary[] {
  const map = new Map<string, AssigneeSlaSummary>();

  for (const row of rows) {
    const key = row.assignedToUserId ?? "__unassigned__";
    const label = row.assignedToLabel ?? "Unassigned";
    const bucket = classifyEvidenceRequestSla(row, atRiskDays, now);
    const existing = map.get(key) ?? {
      assigneeUserId: row.assignedToUserId,
      assigneeLabel: label,
      openCount: 0,
      atRiskCount: 0,
      overdueCount: 0,
      fulfilledCount: 0,
      onTimeRatePercent: 0,
    };

    if (bucket === "on_track" || bucket === "at_risk") existing.openCount += 1;
    if (bucket === "at_risk") existing.atRiskCount += 1;
    if (bucket === "overdue") existing.overdueCount += 1;
    if (bucket === "fulfilled_on_time" || bucket === "fulfilled_late") {
      existing.fulfilledCount += 1;
    }

    map.set(key, existing);
  }

  for (const summary of map.values()) {
    const fulfilled = rows.filter(
      (r) =>
        (r.assignedToUserId ?? "__unassigned__") ===
          (summary.assigneeUserId ?? "__unassigned__") &&
        r.storedStatus === "fulfilled",
    );
    const onTime = fulfilled.filter(
      (r) =>
        r.fulfilledAt &&
        new Date(r.fulfilledAt).getTime() <= new Date(r.dueAt).getTime(),
    ).length;
    summary.onTimeRatePercent =
      fulfilled.length > 0 ? Math.round((onTime / fulfilled.length) * 1000) / 10 : 0;
  }

  return [...map.values()].sort(
    (a, b) => b.overdueCount - a.overdueCount || b.openCount - a.openCount,
  );
}

export function buildFrameworkSlaSummaries(
  rows: AssessorEvidenceRequestRow[],
  atRiskDays: number,
  now = new Date(),
): FrameworkSlaSummary[] {
  const map = new Map<ComplianceFramework, FrameworkSlaSummary>();

  for (const row of rows) {
    const bucket = classifyEvidenceRequestSla(row, atRiskDays, now);
    const existing = map.get(row.framework) ?? {
      framework: row.framework,
      label: row.frameworkLabel,
      openCount: 0,
      overdueCount: 0,
      fulfilledCount: 0,
      onTimeRatePercent: 0,
      href: FRAMEWORK_PATHS[row.framework],
    };

    if (bucket === "on_track" || bucket === "at_risk") existing.openCount += 1;
    if (bucket === "overdue") existing.overdueCount += 1;
    if (bucket === "fulfilled_on_time" || bucket === "fulfilled_late") {
      existing.fulfilledCount += 1;
    }

    map.set(row.framework, existing);
  }

  for (const summary of map.values()) {
    const fulfilled = rows.filter(
      (r) => r.framework === summary.framework && r.storedStatus === "fulfilled",
    );
    const onTime = fulfilled.filter(
      (r) =>
        r.fulfilledAt &&
        new Date(r.fulfilledAt).getTime() <= new Date(r.dueAt).getTime(),
    ).length;
    summary.onTimeRatePercent =
      fulfilled.length > 0 ? Math.round((onTime / fulfilled.length) * 1000) / 10 : 0;
  }

  return [...map.values()].sort((a, b) => b.overdueCount - a.overdueCount);
}

export function buildAuditorEvidenceRequestSlaDigestMarkdown(
  pack: EvidenceRequestSlaDashboardPack,
  orgName: string,
): string {
  const lines = [
    `# Evidence request SLA digest — ${orgName}`,
    "",
    `**${SITE_BRAND_NAME}** · generated ${pack.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Open: **${pack.openCount}** (${pack.atRiskCount} at risk within ${pack.atRiskDays}d, **${pack.overdueCount}** overdue)`,
    `- Fulfillment rate: **${pack.fulfillmentRatePercent}%**`,
    `- On-time fulfillment: **${pack.onTimeFulfillmentPercent}%**`,
    pack.avgFulfillmentDays != null
      ? `- Avg time to fulfill: **${pack.avgFulfillmentDays}** day(s)`
      : "- Avg time to fulfill: _n/a_",
    "",
    "## Overdue queue",
    "",
  ];

  if (pack.overdueQueue.length === 0) {
    lines.push("_No overdue evidence requests._");
  } else {
    for (const item of pack.overdueQueue.slice(0, 15)) {
      lines.push(
        `- **${item.controlRef}** (${item.frameworkLabel}): ${item.title} — ${item.daysOverdue}d overdue${item.assignedToLabel ? ` · ${item.assignedToLabel}` : " · unassigned"}`,
      );
    }
  }

  lines.push("", "## At risk", "");
  if (pack.atRiskQueue.length === 0) {
    lines.push("_No requests in the at-risk window._");
  } else {
    for (const item of pack.atRiskQueue.slice(0, 10)) {
      lines.push(
        `- **${item.controlRef}**: ${item.title} — due ${item.dueAt.slice(0, 10)} (${item.daysUntilDue}d)`,
      );
    }
  }

  lines.push("", "---", `_Console: evidence request SLA dashboard and fulfillment queue._`);
  return lines.join("\n");
}

export function buildEvidenceRequestSlaDashboardFromRows(input: {
  orgId: string | null;
  rows: AssessorEvidenceRequestRow[];
  atRiskDays: number;
  generatedAt?: string;
}): EvidenceRequestSlaDashboardPack {
  const now = new Date();
  const buckets = input.rows.map((r) => ({
    row: r,
    bucket: classifyEvidenceRequestSla(r, input.atRiskDays, now),
  }));

  const overdueQueue = buckets
    .filter((b) => b.bucket === "overdue")
    .map((b) => toSlaQueueItem(b.row, b.bucket, now))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const atRiskQueue = buckets
    .filter((b) => b.bucket === "at_risk")
    .map((b) => toSlaQueueItem(b.row, b.bucket, now))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const fulfilled = input.rows.filter((r) => r.storedStatus === "fulfilled");
  const onTime = fulfilled.filter(
    (r) =>
      r.fulfilledAt &&
      new Date(r.fulfilledAt).getTime() <= new Date(r.dueAt).getTime(),
  );
  const closed = fulfilled.length + input.rows.filter((r) => r.storedStatus === "cancelled").length;
  const fulfillmentDayValues = fulfilled
    .map(computeFulfillmentDays)
    .filter((d): d is number => d != null);
  const avgFulfillmentDays =
    fulfillmentDayValues.length > 0
      ? Math.round(
          (fulfillmentDayValues.reduce((s, d) => s + d, 0) / fulfillmentDayValues.length) * 10,
        ) / 10
      : null;

  const openCount = buckets.filter(
    (b) => b.bucket === "on_track" || b.bucket === "at_risk" || b.bucket === "overdue",
  ).length;

  const pack: EvidenceRequestSlaDashboardPack = {
    version: EVIDENCE_REQUEST_SLA_DASHBOARD_VERSION,
    generatedAt: input.generatedAt ?? now.toISOString(),
    orgId: input.orgId,
    atRiskDays: input.atRiskDays,
    totalCount: input.rows.length,
    openCount,
    overdueCount: overdueQueue.length,
    atRiskCount: atRiskQueue.length,
    onTrackCount: buckets.filter((b) => b.bucket === "on_track").length,
    fulfilledCount: fulfilled.length,
    cancelledCount: buckets.filter((b) => b.bucket === "cancelled").length,
    fulfillmentRatePercent:
      input.rows.length > 0
        ? Math.round((fulfilled.length / input.rows.length) * 1000) / 10
        : 0,
    onTimeFulfillmentPercent:
      fulfilled.length > 0 ? Math.round((onTime.length / fulfilled.length) * 1000) / 10 : 0,
    avgFulfillmentDays,
    overdueQueue,
    atRiskQueue,
    assigneeSummaries: buildAssigneeSlaSummaries(input.rows, input.atRiskDays, now),
    frameworkSummaries: buildFrameworkSlaSummaries(input.rows, input.atRiskDays, now),
    auditorDigestPreview: "",
  };

  pack.auditorDigestPreview = buildAuditorEvidenceRequestSlaDigestMarkdown(pack, "Organization");
  return pack;
}

export async function getEvidenceRequestSlaOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<EvidenceRequestSlaOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_evidence_request_sla_at_risk_days, compliance_evidence_request_sla_digest_email_enabled, compliance_evidence_request_sla_digest_webhook_url",
    )
    .eq("id", orgId)
    .maybeSingle();

  const url = data?.compliance_evidence_request_sla_digest_webhook_url;
  return {
    atRiskDays: Number(data?.compliance_evidence_request_sla_at_risk_days ?? 3) || 3,
    digestEmailEnabled: data?.compliance_evidence_request_sla_digest_email_enabled !== false,
    digestWebhookUrl: typeof url === "string" && url.trim() ? url.trim() : null,
  };
}

export async function buildEvidenceRequestSlaDashboardPack(
  userId: string,
  opts: { orgId: string | null; supabase?: SupabaseClient },
): Promise<EvidenceRequestSlaDashboardPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getEvidenceRequestSlaOrgSettings(opts.orgId, supabase);
  const rows = await listAssessorEvidenceRequests(opts.orgId, supabase);

  return buildEvidenceRequestSlaDashboardFromRows({
    orgId: opts.orgId,
    rows,
    atRiskDays: settings.atRiskDays,
  });
}

export function evidenceRequestSlaDashboardToCsv(pack: EvidenceRequestSlaDashboardPack): string {
  const lines = [
    "section,request_id,control_ref,framework,title,sla_bucket,due_at,days_until_due,days_overdue,assignee",
    ...pack.overdueQueue.map((i) =>
      [
        "overdue",
        i.requestId,
        i.controlRef,
        i.frameworkLabel,
        JSON.stringify(i.title),
        i.slaBucket,
        i.dueAt.slice(0, 10),
        i.daysUntilDue,
        i.daysOverdue,
        JSON.stringify(i.assignedToLabel ?? ""),
      ].join(","),
    ),
    ...pack.atRiskQueue.map((i) =>
      [
        "at_risk",
        i.requestId,
        i.controlRef,
        i.frameworkLabel,
        JSON.stringify(i.title),
        i.slaBucket,
        i.dueAt.slice(0, 10),
        i.daysUntilDue,
        i.daysOverdue,
        JSON.stringify(i.assignedToLabel ?? ""),
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

export function buildAuditorSlaDigestPayload(
  pack: EvidenceRequestSlaDashboardPack,
  siteOrigin: string,
): AuditorEvidenceRequestSlaDigest {
  const origin = siteOrigin.replace(/\/$/, "");
  return {
    type: "zentro.evidence_request_sla_digest",
    version: EVIDENCE_REQUEST_SLA_DASHBOARD_VERSION,
    orgId: pack.orgId ?? "",
    generatedAt: pack.generatedAt,
    summary: {
      open: pack.openCount,
      overdue: pack.overdueCount,
      atRisk: pack.atRiskCount,
      fulfillmentRatePercent: pack.fulfillmentRatePercent,
      onTimeFulfillmentPercent: pack.onTimeFulfillmentPercent,
    },
    overdue: pack.overdueQueue.slice(0, 25),
    atRisk: pack.atRiskQueue.slice(0, 15),
    consoleUrl: `${origin}/governance/compliance/evidence-request-sla`,
  };
}

export type DeliverEvidenceRequestSlaDigestResult =
  | {
      ok: true;
      deliveryId: string;
      webhookDelivered: boolean;
      emailsSent: number;
      digest: AuditorEvidenceRequestSlaDigest;
    }
  | { ok: false; reason: string };

export async function deliverEvidenceRequestSlaDigest(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    supabase?: SupabaseClient;
  },
): Promise<DeliverEvidenceRequestSlaDigestResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const pack = await buildEvidenceRequestSlaDashboardPack(actorUserId, { orgId, supabase });
  if (!pack) return { ok: false, reason: "Could not build SLA dashboard." };

  const settings = await getEvidenceRequestSlaOrgSettings(orgId, supabase);
  const digest = buildAuditorSlaDigestPayload(pack, opts.siteOrigin);

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");

  const markdown = buildAuditorEvidenceRequestSlaDigestMarkdown(pack, orgName);
  let webhookDelivered = false;
  let emailsSent = 0;

  if (settings.digestWebhookUrl) {
    const webhook = await deliverHttpsJsonWebhook(settings.digestWebhookUrl, digest);
    webhookDelivered = webhook.ok;
  }

  if (settings.digestEmailEnabled && isTransactionalEmailConfigured()) {
    const members = await listOrgMembers(orgId, { supabase });
    const auditors = members.filter((m) => isReadOnlyAuditorRole(m.role) && m.email?.trim());

    for (const auditor of auditors) {
      const sent = await sendTransactionalEmailWithAudit({
        to: auditor.email!.trim(),
        subject: `[Zentro] Evidence request SLA digest — ${orgName}`,
        text: markdown,
        userId: actorUserId,
        orgId,
        auditDetails: {
          event: "governance.evidence_request_sla_digest_emailed",
          auditor_user_id: auditor.userId,
          overdue_count: pack.overdueCount,
        },
      });
      if (sent.ok) emailsSent += 1;
    }
  }

  const deliveryStatus =
    webhookDelivered || emailsSent > 0 ? "delivered" : "recorded_no_channel";

  const { data: delivery, error } = await supabase
    .from("compliance_evidence_request_sla_deliveries")
    .insert({
      org_id: orgId,
      overdue_count: pack.overdueCount,
      at_risk_count: pack.atRiskCount,
      fulfillment_rate_percent: pack.fulfillmentRatePercent,
      delivery_status: deliveryStatus,
      delivery_note:
        webhookDelivered || emailsSent > 0
          ? `webhook=${webhookDelivered}; emails=${emailsSent}`
          : "No webhook or auditor emails configured",
    })
    .select("id")
    .single();

  if (error || !delivery) {
    return { ok: false, reason: error?.message ?? "delivery_log_failed" };
  }

  await appendAuditEvent({
    event_type: "governance.evidence_request_sla_digest_delivered",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      delivery_id: delivery.id,
      overdue_count: pack.overdueCount,
      at_risk_count: pack.atRiskCount,
      webhook_delivered: webhookDelivered,
      emails_sent: emailsSent,
    },
  });

  return {
    ok: true,
    deliveryId: String(delivery.id),
    webhookDelivered,
    emailsSent,
    digest,
  };
}
