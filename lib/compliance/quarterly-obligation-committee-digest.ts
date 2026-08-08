import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { buildBoardObligationForecastPack } from "@/lib/compliance/board-obligation-forecast";
import type { BoardObligationForecastPack } from "@/lib/compliance/board-obligation-forecast";
import { deliverHttpsJsonWebhook } from "@/lib/compliance/compliance-digest";
import {
  buildEvidenceRequestSlaDashboardPack,
  type EvidenceRequestSlaDashboardPack,
} from "@/lib/compliance/evidence-request-sla-dashboard";
import { buildObligationCrossoverReportPack } from "@/lib/compliance/obligation-crossover-report";
import type { ObligationCrossoverReportPack } from "@/lib/compliance/obligation-crossover-report";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmailWithAudit,
} from "@/lib/notifications/email";
import { listOrgMembers } from "@/lib/org/data";
import { MEMBER_ADMIN_ROLES } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const QUARTERLY_OBLIGATION_COMMITTEE_DIGEST_VERSION =
  "smohix-quarterly-obligation-committee-digest/1";

export const COMMITTEE_DIGEST_HORIZON_DAYS = 90;

export const COMMITTEE_DIGEST_QUARTERLY_DAYS = 90;

export type CommitteeDigestOrgSettings = {
  digestEmailEnabled: boolean;
  digestWebhookUrl: string | null;
};

export type CommitteeDigestDeliveryRow = {
  id: string;
  orgId: string;
  peakWeekKey: string | null;
  peakWeekCount: number;
  crossoverClusterCount: number;
  slaOverdueCount: number;
  slaAtRiskCount: number;
  deliveryStatus: string;
  deliveryNote: string | null;
  createdAt: string;
};

export type QuarterlyObligationCommitteeDigestPack = {
  version: typeof QUARTERLY_OBLIGATION_COMMITTEE_DIGEST_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  forecast: BoardObligationForecastPack | null;
  crossover: ObligationCrossoverReportPack | null;
  sla: EvidenceRequestSlaDashboardPack | null;
  digestPreviewMarkdown: string;
  lastDeliveryAt: string | null;
  quarterlyDue: boolean;
  daysSinceLastDelivery: number | null;
};

export type ObligationCommitteeDigestPayload = {
  type: "smohix.obligation_committee_digest";
  version: typeof QUARTERLY_OBLIGATION_COMMITTEE_DIGEST_VERSION;
  orgId: string;
  generatedAt: string;
  horizonDays: number;
  forecast: {
    totalObligations: number;
    peakWeekKey: string | null;
    peakWeekCount: number;
    currentOverdue: number;
    committeeSummary: string;
  };
  crossover: {
    clusterCount: number;
    multiFrameworkCount: number;
    topClusters: { id: string; frameworks: string[]; obligationCount: number; overdueCount: number }[];
  };
  sla: {
    open: number;
    overdue: number;
    atRisk: number;
    onTimeFulfillmentPercent: number;
  };
  consoleUrl: string;
};

function mapDeliveryRow(raw: Record<string, unknown>): CommitteeDigestDeliveryRow {
  return {
    id: String(raw.id),
    orgId: String(raw.org_id),
    peakWeekKey: raw.peak_week_key ? String(raw.peak_week_key) : null,
    peakWeekCount: Number(raw.peak_week_count) || 0,
    crossoverClusterCount: Number(raw.crossover_cluster_count) || 0,
    slaOverdueCount: Number(raw.sla_overdue_count) || 0,
    slaAtRiskCount: Number(raw.sla_at_risk_count) || 0,
    deliveryStatus: String(raw.delivery_status),
    deliveryNote: raw.delivery_note ? String(raw.delivery_note) : null,
    createdAt: String(raw.created_at),
  };
}

export function daysSinceIso(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / 86_400_000);
}

export function isQuarterlyDigestDue(
  lastDeliveryAt: string | null,
  periodDays = COMMITTEE_DIGEST_QUARTERLY_DAYS,
  now = Date.now(),
): boolean {
  if (!lastDeliveryAt) return true;
  const days = daysSinceIso(lastDeliveryAt, now);
  return days === null || days >= periodDays;
}

export function buildCommitteeDigestPayload(
  input: {
    orgId: string;
    generatedAt: string;
    horizonDays: number;
    forecast: BoardObligationForecastPack | null;
    crossover: ObligationCrossoverReportPack | null;
    sla: EvidenceRequestSlaDashboardPack | null;
  },
  siteOrigin: string,
): ObligationCommitteeDigestPayload {
  const origin = siteOrigin.replace(/\/$/, "");
  return {
    type: "smohix.obligation_committee_digest",
    version: QUARTERLY_OBLIGATION_COMMITTEE_DIGEST_VERSION,
    orgId: input.orgId,
    generatedAt: input.generatedAt,
    horizonDays: input.horizonDays,
    forecast: {
      totalObligations: input.forecast?.totalForecastObligations ?? 0,
      peakWeekKey: input.forecast?.peakWeekKey ?? null,
      peakWeekCount: input.forecast?.peakWeekCount ?? 0,
      currentOverdue: input.forecast?.currentOverdue ?? 0,
      committeeSummary: input.forecast?.committeeSummary ?? "",
    },
    crossover: {
      clusterCount: input.crossover?.crossoverClusterCount ?? 0,
      multiFrameworkCount: input.crossover?.multiFrameworkObligationCount ?? 0,
      topClusters: (input.crossover?.clusters ?? []).slice(0, 8).map((c) => ({
        id: c.id,
        frameworks: c.frameworks,
        obligationCount: c.obligationCount,
        overdueCount: c.overdueCount,
      })),
    },
    sla: {
      open: input.sla?.openCount ?? 0,
      overdue: input.sla?.overdueCount ?? 0,
      atRisk: input.sla?.atRiskCount ?? 0,
      onTimeFulfillmentPercent: input.sla?.onTimeFulfillmentPercent ?? 0,
    },
    consoleUrl: `${origin}/governance/compliance/committee-digest`,
  };
}

export function buildCommitteeDigestMarkdown(
  pack: QuarterlyObligationCommitteeDigestPack,
  orgName: string,
): string {
  const lines = [
    `# Quarterly obligation committee digest — ${orgName}`,
    "",
    `**${SITE_BRAND_NAME}** · ${pack.generatedAt} · ${pack.horizonDays}-day horizon`,
    "",
  ];

  if (pack.forecast) {
    lines.push("## Forecast timeline", "", pack.forecast.committeeSummary, "");
    lines.push(
      `- Open obligations: **${pack.forecast.totalForecastObligations}**`,
      `- Peak week: **${pack.forecast.peakWeekKey ?? "n/a"}** (${pack.forecast.peakWeekCount} items)`,
      `- Overdue now: **${pack.forecast.currentOverdue}** · Due ≤7d: **${pack.forecast.currentDueSoon}**`,
      "",
    );
    if (pack.forecast.milestones.length > 0) {
      lines.push("### Upcoming milestones", "");
      for (const m of pack.forecast.milestones.slice(0, 8)) {
        lines.push(`- ${m.dueAt.slice(0, 10)} · ${m.title} (${m.urgency})`);
      }
      lines.push("");
    }
  }

  if (pack.crossover) {
    lines.push(
      "## Crossover clusters",
      "",
      `- Multi-framework obligations: **${pack.crossover.multiFrameworkObligationCount}**`,
      `- Reuse clusters: **${pack.crossover.crossoverClusterCount}**`,
      "",
    );
    for (const c of pack.crossover.clusters.slice(0, 5)) {
      lines.push(
        `- **${c.frameworks.join(" + ")}** · ${c.obligationCount} obligations · ${c.overdueCount} overdue`,
      );
      lines.push(`  ${c.evidenceReuseNote}`);
    }
    lines.push("");
  }

  if (pack.sla) {
    lines.push(
      "## Evidence request SLAs",
      "",
      `- Open: **${pack.sla.openCount}** (${pack.sla.atRiskCount} at risk, **${pack.sla.overdueCount}** overdue)`,
      `- On-time fulfillment: **${pack.sla.onTimeFulfillmentPercent}%**`,
      "",
    );
    if (pack.sla.overdueQueue.length > 0) {
      lines.push("### SLA overdue", "");
      for (const item of pack.sla.overdueQueue.slice(0, 8)) {
        lines.push(`- ${item.controlRef}: ${item.title} (${item.daysOverdue}d overdue)`);
      }
      lines.push("");
    }
  }

  lines.push(
    "## Console",
    "",
    "- Forecast: /governance/compliance/obligation-forecast",
    "- Crossover: /governance/compliance/obligation-crossover",
    "- SLA dashboard: /governance/compliance/evidence-request-sla",
    "- Committee pack: /governance/compliance/committee-meeting-pack",
  );

  return lines.join("\n");
}

export function buildQuarterlyObligationCommitteeDigestFromParts(input: {
  orgId: string | null;
  horizonDays: number;
  forecast: BoardObligationForecastPack | null;
  crossover: ObligationCrossoverReportPack | null;
  sla: EvidenceRequestSlaDashboardPack | null;
  lastDeliveryAt?: string | null;
  orgName?: string;
  generatedAt?: string;
}): QuarterlyObligationCommitteeDigestPack {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const daysSince = daysSinceIso(input.lastDeliveryAt ?? null);
  const quarterlyDue = isQuarterlyDigestDue(input.lastDeliveryAt ?? null);

  const partial: QuarterlyObligationCommitteeDigestPack = {
    version: QUARTERLY_OBLIGATION_COMMITTEE_DIGEST_VERSION,
    generatedAt,
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    forecast: input.forecast,
    crossover: input.crossover,
    sla: input.sla,
    digestPreviewMarkdown: "",
    lastDeliveryAt: input.lastDeliveryAt ?? null,
    quarterlyDue,
    daysSinceLastDelivery: daysSince,
  };

  partial.digestPreviewMarkdown = buildCommitteeDigestMarkdown(
    partial,
    input.orgName ?? "Organization",
  );
  return partial;
}

export async function getCommitteeDigestOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<CommitteeDigestOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_committee_digest_email_enabled, compliance_committee_digest_webhook_url",
    )
    .eq("id", orgId)
    .maybeSingle();

  const url = data?.compliance_committee_digest_webhook_url;
  return {
    digestEmailEnabled: data?.compliance_committee_digest_email_enabled !== false,
    digestWebhookUrl: typeof url === "string" && url.trim() ? url.trim() : null,
  };
}

export async function listCommitteeDigestDeliveries(
  orgId: string,
  opts?: { supabase?: SupabaseClient; limit?: number },
): Promise<CommitteeDigestDeliveryRow[]> {
  const client = opts?.supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_obligation_committee_digest_deliveries")
    .select(
      "id, org_id, peak_week_key, peak_week_count, crossover_cluster_count, sla_overdue_count, sla_at_risk_count, delivery_status, delivery_note, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 12);

  if (error) throw error;
  return (data ?? []).map((row) => mapDeliveryRow(row as Record<string, unknown>));
}

export async function getLastCommitteeDigestDeliveryAt(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<string | null> {
  const rows = await listCommitteeDigestDeliveries(orgId, { supabase, limit: 1 });
  return rows[0]?.createdAt ?? null;
}

export async function buildQuarterlyObligationCommitteeDigestPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
    orgName?: string;
  },
): Promise<QuarterlyObligationCommitteeDigestPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? COMMITTEE_DIGEST_HORIZON_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [forecast, crossover, sla, lastDeliveryAt] = await Promise.all([
    buildBoardObligationForecastPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildObligationCrossoverReportPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildEvidenceRequestSlaDashboardPack(userId, { orgId: opts.orgId, supabase }),
    getLastCommitteeDigestDeliveryAt(opts.orgId, supabase),
  ]);

  return buildQuarterlyObligationCommitteeDigestFromParts({
    orgId: opts.orgId,
    horizonDays,
    forecast,
    crossover,
    sla,
    lastDeliveryAt,
    orgName: opts.orgName,
  });
}

export function committeeDigestToCsv(pack: QuarterlyObligationCommitteeDigestPack): string {
  const lines = [
    "section,metric,value",
    ["forecast", "total_obligations", pack.forecast?.totalForecastObligations ?? 0].join(","),
    ["forecast", "peak_week_count", pack.forecast?.peakWeekCount ?? 0].join(","),
    ["crossover", "cluster_count", pack.crossover?.crossoverClusterCount ?? 0].join(","),
    ["sla", "overdue", pack.sla?.overdueCount ?? 0].join(","),
    ["sla", "at_risk", pack.sla?.atRiskCount ?? 0].join(","),
  ];
  return `${lines.join("\n")}\n`;
}

export type DeliverCommitteeDigestResult =
  | {
      ok: true;
      deliveryId: string;
      webhookDelivered: boolean;
      emailsSent: number;
      digest: ObligationCommitteeDigestPayload;
      skippedQuarterly?: boolean;
    }
  | { ok: false; reason: string };

export async function deliverQuarterlyObligationCommitteeDigest(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    supabase?: SupabaseClient;
    force?: boolean;
    scheduled?: boolean;
  },
): Promise<DeliverCommitteeDigestResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const lastAt = await getLastCommitteeDigestDeliveryAt(orgId, supabase);

  if (opts.scheduled && !opts.force && !isQuarterlyDigestDue(lastAt)) {
    return { ok: false, reason: "Quarterly digest not due yet." };
  }

  const pack = await buildQuarterlyObligationCommitteeDigestPack(actorUserId, {
    orgId,
    supabase,
    orgName: opts.orgName,
  });
  if (!pack) return { ok: false, reason: "Could not build committee digest." };

  const settings = await getCommitteeDigestOrgSettings(orgId, supabase);
  const digest = buildCommitteeDigestPayload(
    {
      orgId,
      generatedAt: pack.generatedAt,
      horizonDays: pack.horizonDays,
      forecast: pack.forecast,
      crossover: pack.crossover,
      sla: pack.sla,
    },
    opts.siteOrigin,
  );

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");
  const markdown = buildCommitteeDigestMarkdown(pack, orgName);

  let webhookDelivered = false;
  let emailsSent = 0;

  if (settings.digestWebhookUrl) {
    const webhook = await deliverHttpsJsonWebhook(settings.digestWebhookUrl, digest);
    webhookDelivered = webhook.ok;
  }

  if (settings.digestEmailEnabled && isTransactionalEmailConfigured()) {
    const members = await listOrgMembers(orgId, { supabase });
    const recipients = members.filter(
      (m) => MEMBER_ADMIN_ROLES.includes(m.role) && m.email?.trim(),
    );

    for (const recipient of recipients) {
      const sent = await sendTransactionalEmailWithAudit({
        to: recipient.email!.trim(),
        subject: `[Smohix] Quarterly obligation committee digest — ${orgName}`,
        text: markdown,
        userId: actorUserId,
        orgId,
        auditDetails: {
          event: "governance.obligation_committee_digest_emailed",
          recipient_role: recipient.role,
          peak_week_count: pack.forecast?.peakWeekCount ?? 0,
        },
      });
      if (sent.ok) emailsSent += 1;
    }
  }

  const deliveryStatus =
    webhookDelivered || emailsSent > 0 ? "delivered" : "recorded_no_channel";

  const { data: delivery, error } = await supabase
    .from("compliance_obligation_committee_digest_deliveries")
    .insert({
      org_id: orgId,
      peak_week_key: pack.forecast?.peakWeekKey ?? null,
      peak_week_count: pack.forecast?.peakWeekCount ?? 0,
      crossover_cluster_count: pack.crossover?.crossoverClusterCount ?? 0,
      sla_overdue_count: pack.sla?.overdueCount ?? 0,
      sla_at_risk_count: pack.sla?.atRiskCount ?? 0,
      delivery_status: deliveryStatus,
      delivery_note:
        webhookDelivered || emailsSent > 0
          ? `webhook=${webhookDelivered}; emails=${emailsSent}`
          : "No webhook or committee emails configured",
    })
    .select("id")
    .single();

  if (error || !delivery) {
    return { ok: false, reason: error?.message ?? "delivery_log_failed" };
  }

  await appendAuditEvent({
    event_type: "governance.obligation_committee_digest_delivered",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      delivery_id: delivery.id,
      peak_week_count: pack.forecast?.peakWeekCount ?? 0,
      crossover_cluster_count: pack.crossover?.crossoverClusterCount ?? 0,
      sla_overdue_count: pack.sla?.overdueCount ?? 0,
      webhook_delivered: webhookDelivered,
      emails_sent: emailsSent,
      scheduled: Boolean(opts.scheduled),
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

export async function updateCommitteeDigestOrgSettings(
  orgId: string,
  input: { digestEmailEnabled?: boolean; digestWebhookUrl?: string | null },
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {};
  if (input.digestEmailEnabled !== undefined) {
    patch.compliance_committee_digest_email_enabled = input.digestEmailEnabled;
  }
  if (input.digestWebhookUrl !== undefined) {
    patch.compliance_committee_digest_webhook_url = input.digestWebhookUrl;
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  return !error;
}
