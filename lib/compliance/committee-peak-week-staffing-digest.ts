import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { buildCommitteeObligationCapacityBudgetPack } from "@/lib/compliance/committee-obligation-capacity-budget";
import type { CommitteeObligationCapacityBudgetPack } from "@/lib/compliance/committee-obligation-capacity-budget";
import { deliverHttpsJsonWebhook } from "@/lib/compliance/compliance-digest";
import { buildObligationOwnerLoadBalancingPack } from "@/lib/compliance/obligation-owner-load-balancing";
import type { ObligationOwnerLoadBalancingPack } from "@/lib/compliance/obligation-owner-load-balancing";
import {
  isSlackWebhookConfigured,
  sendSlackNotificationWithAudit,
} from "@/lib/integrations/slack";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmailWithAudit,
} from "@/lib/notifications/email";
import { listOrgMembers } from "@/lib/org/data";
import { MEMBER_ADMIN_ROLES } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const PEAK_WEEK_STAFFING_DIGEST_VERSION =
  "smohix-peak-week-staffing-digest/1";

export const STAFFING_DIGEST_HORIZON_DAYS = 90;

export const DEFAULT_LOAD_IMBALANCE_THRESHOLD = 2;

export type PeakWeekStaffingDigestOrgSettings = {
  digestEnabled: boolean;
  emailEnabled: boolean;
  webhookUrl: string | null;
};

export type PeakWeekStaffingCoincidence = {
  peakWeekKey: string | null;
  peakWeekLabel: string | null;
  capacityShortfallHours: number;
  estimatedOwnerHours: number;
  availableOwnerHours: number;
  imbalanceScore: number;
  suggestionCount: number;
  peakWeekObligationCount: number;
  shouldAlert: boolean;
  alertReason: string;
};

export type PeakWeekStaffingDigestDeliveryRow = {
  id: string;
  orgId: string;
  peakWeekKey: string | null;
  shortfallHours: number;
  imbalanceScore: number;
  suggestionCount: number;
  deliveryStatus: string;
  deliveryNote: string | null;
  createdAt: string;
};

export type PeakWeekStaffingDigestPack = {
  version: typeof PEAK_WEEK_STAFFING_DIGEST_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  settings: PeakWeekStaffingDigestOrgSettings;
  capacity: CommitteeObligationCapacityBudgetPack | null;
  loadBalance: ObligationOwnerLoadBalancingPack | null;
  coincidence: PeakWeekStaffingCoincidence;
  digestPreviewMarkdown: string;
  lastDeliveryAt: string | null;
};

export type PeakWeekStaffingDigestPayload = {
  type: "smohix.peak_week_staffing_digest";
  version: typeof PEAK_WEEK_STAFFING_DIGEST_VERSION;
  orgId: string;
  generatedAt: string;
  horizonDays: number;
  peakWeekKey: string | null;
  capacity: {
    shortfallHours: number;
    estimatedHours: number;
    availableHours: number;
    capacityOwnerCount: number;
  };
  loadBalance: {
    imbalanceScore: number;
    suggestionCount: number;
    peakWeekObligationCount: number;
    ownerCount: number;
  };
  consoleUrl: string;
};

export function evaluatePeakWeekStaffingCoincidence(input: {
  capacity: CommitteeObligationCapacityBudgetPack | null;
  loadBalance: ObligationOwnerLoadBalancingPack | null;
  imbalanceThreshold?: number;
}): PeakWeekStaffingCoincidence {
  const threshold = input.imbalanceThreshold ?? DEFAULT_LOAD_IMBALANCE_THRESHOLD;
  const peakWeekKey =
    input.capacity?.forecast?.peakWeekKey ??
    input.loadBalance?.peakWeekKey ??
    null;

  const capacityWeek = input.capacity?.weeks.find((w) => w.weekKey === peakWeekKey);
  const shortfallHours = capacityWeek?.shortfallHours ?? 0;
  const estimatedOwnerHours = capacityWeek?.estimatedOwnerHours ?? 0;
  const availableOwnerHours = capacityWeek?.availableOwnerHours ?? 0;

  const imbalanceScore = input.loadBalance?.imbalanceScore ?? 0;
  const suggestionCount = input.loadBalance?.suggestions.length ?? 0;
  const peakWeekObligationCount = input.loadBalance?.peakWeekObligationCount ?? 0;

  const hasShortfall = Boolean(capacityWeek?.isShortfall);
  const hasImbalance =
    imbalanceScore >= threshold &&
    input.loadBalance?.peakWeekKey === peakWeekKey;

  const shouldAlert = Boolean(peakWeekKey && hasShortfall && hasImbalance);

  let alertReason: string;
  if (!peakWeekKey) {
    alertReason = "No forecast peak week to evaluate.";
  } else if (!hasShortfall && !hasImbalance) {
    alertReason = "Peak week has capacity headroom and balanced owner load.";
  } else if (hasShortfall && !hasImbalance) {
    alertReason = `Peak week ${peakWeekKey} has capacity shortfall (${shortfallHours}h) but owner load is balanced.`;
  } else if (!hasShortfall && hasImbalance) {
    alertReason = `Peak week ${peakWeekKey} has load imbalance (${imbalanceScore}) without capacity shortfall.`;
  } else {
    alertReason = `Peak week ${peakWeekKey}: capacity shortfall ${shortfallHours}h and load imbalance ${imbalanceScore} coincide.`;
  }

  return {
    peakWeekKey,
    peakWeekLabel: capacityWeek?.weekLabel ?? input.loadBalance?.peakWeekLabel ?? null,
    capacityShortfallHours: shortfallHours,
    estimatedOwnerHours,
    availableOwnerHours,
    imbalanceScore,
    suggestionCount,
    peakWeekObligationCount,
    shouldAlert,
    alertReason,
  };
}

export function buildPeakWeekStaffingDigestMarkdown(
  pack: PeakWeekStaffingDigestPack,
  orgName: string,
): string {
  const c = pack.coincidence;
  const lines = [
    `# Peak-week staffing digest — ${orgName}`,
    "",
    `**${SITE_BRAND_NAME}** detected capacity shortfall and owner load imbalance in the same forecast peak week.`,
    "",
    `## Peak week ${c.peakWeekLabel ?? c.peakWeekKey ?? "—"}`,
    "",
    `- **Capacity shortfall:** ${c.capacityShortfallHours}h (${c.estimatedOwnerHours}h estimated vs ${c.availableOwnerHours}h available)`,
    `- **Load imbalance score:** ${c.imbalanceScore}`,
    `- **Rebalance suggestions:** ${c.suggestionCount}`,
    `- **Peak-week obligations:** ${c.peakWeekObligationCount}`,
    "",
    pack.loadBalance?.committeeSummary ?? "",
    "",
    pack.capacity?.committeeSummary ?? "",
    "",
    `Capacity budget: ${pack.coincidence.peakWeekKey ? "see console" : "—"}`,
    `Load balancing: ${pack.loadBalance?.suggestions.length ?? 0} suggestion(s)`,
    "",
    `Open: ${pack.coincidence.peakWeekKey ? "governance/compliance/peak-week-staffing-digest" : ""}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function buildPeakWeekStaffingDigestPayload(
  input: {
    orgId: string;
    generatedAt: string;
    horizonDays: number;
    coincidence: PeakWeekStaffingCoincidence;
    capacity: CommitteeObligationCapacityBudgetPack | null;
    loadBalance: ObligationOwnerLoadBalancingPack | null;
  },
  siteOrigin: string,
): PeakWeekStaffingDigestPayload {
  const origin = siteOrigin.replace(/\/$/, "");
  return {
    type: "smohix.peak_week_staffing_digest",
    version: PEAK_WEEK_STAFFING_DIGEST_VERSION,
    orgId: input.orgId,
    generatedAt: input.generatedAt,
    horizonDays: input.horizonDays,
    peakWeekKey: input.coincidence.peakWeekKey,
    capacity: {
      shortfallHours: input.coincidence.capacityShortfallHours,
      estimatedHours: input.coincidence.estimatedOwnerHours,
      availableHours: input.coincidence.availableOwnerHours,
      capacityOwnerCount: input.capacity?.capacityOwnerCount ?? 0,
    },
    loadBalance: {
      imbalanceScore: input.coincidence.imbalanceScore,
      suggestionCount: input.coincidence.suggestionCount,
      peakWeekObligationCount: input.coincidence.peakWeekObligationCount,
      ownerCount: input.loadBalance?.ownerLoads.length ?? 0,
    },
    consoleUrl: `${origin}/governance/compliance/peak-week-staffing-digest`,
  };
}

export async function getPeakWeekStaffingDigestOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<PeakWeekStaffingDigestOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_peak_week_staffing_digest_enabled, compliance_peak_week_staffing_email_enabled, compliance_peak_week_staffing_webhook_url",
    )
    .eq("id", orgId)
    .maybeSingle();

  const url = data?.compliance_peak_week_staffing_webhook_url;
  return {
    digestEnabled: data?.compliance_peak_week_staffing_digest_enabled !== false,
    emailEnabled: data?.compliance_peak_week_staffing_email_enabled !== false,
    webhookUrl: typeof url === "string" && url.trim() ? url.trim() : null,
  };
}

export async function updatePeakWeekStaffingDigestOrgSettings(
  orgId: string,
  input: Partial<PeakWeekStaffingDigestOrgSettings>,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {};
  if (input.digestEnabled !== undefined) {
    patch.compliance_peak_week_staffing_digest_enabled = input.digestEnabled;
  }
  if (input.emailEnabled !== undefined) {
    patch.compliance_peak_week_staffing_email_enabled = input.emailEnabled;
  }
  if (input.webhookUrl !== undefined) {
    patch.compliance_peak_week_staffing_webhook_url = input.webhookUrl;
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  return !error;
}

export async function getLastPeakWeekStaffingDeliveryAt(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<string | null> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_peak_week_staffing_digest_deliveries")
    .select("created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.created_at ? String(data.created_at) : null;
}

export async function wasPeakWeekStaffingDelivered(
  orgId: string,
  peakWeekKey: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_peak_week_staffing_digest_deliveries")
    .select("id")
    .eq("org_id", orgId)
    .eq("peak_week_key", peakWeekKey)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function listPeakWeekStaffingDigestDeliveries(
  orgId: string,
  opts?: { supabase?: SupabaseClient; limit?: number },
): Promise<PeakWeekStaffingDigestDeliveryRow[]> {
  const client = opts?.supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_peak_week_staffing_digest_deliveries")
    .select(
      "id, org_id, peak_week_key, shortfall_hours, imbalance_score, suggestion_count, delivery_status, delivery_note, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 10);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    orgId: String(row.org_id),
    peakWeekKey: row.peak_week_key ? String(row.peak_week_key) : null,
    shortfallHours: Number(row.shortfall_hours) || 0,
    imbalanceScore: Number(row.imbalance_score) || 0,
    suggestionCount: Number(row.suggestion_count) || 0,
    deliveryStatus: String(row.delivery_status),
    deliveryNote: row.delivery_note ? String(row.delivery_note) : null,
    createdAt: String(row.created_at),
  }));
}

export async function buildPeakWeekStaffingDigestPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    orgName?: string;
    supabase?: SupabaseClient;
  },
): Promise<PeakWeekStaffingDigestPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? STAFFING_DIGEST_HORIZON_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [capacity, loadBalance, settings, lastDeliveryAt] = await Promise.all([
    buildCommitteeObligationCapacityBudgetPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildObligationOwnerLoadBalancingPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    getPeakWeekStaffingDigestOrgSettings(opts.orgId, supabase),
    getLastPeakWeekStaffingDeliveryAt(opts.orgId, supabase),
  ]);

  const coincidence = evaluatePeakWeekStaffingCoincidence({ capacity, loadBalance });
  const generatedAt = new Date().toISOString();

  const pack: PeakWeekStaffingDigestPack = {
    version: PEAK_WEEK_STAFFING_DIGEST_VERSION,
    generatedAt,
    orgId: opts.orgId,
    horizonDays,
    settings,
    capacity,
    loadBalance,
    coincidence,
    digestPreviewMarkdown: "",
    lastDeliveryAt,
  };

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", opts.orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");
  pack.digestPreviewMarkdown = buildPeakWeekStaffingDigestMarkdown(pack, orgName);

  return pack;
}

export function peakWeekStaffingDigestToCsv(pack: PeakWeekStaffingDigestPack): string {
  const c = pack.coincidence;
  const lines = [
    "metric,value",
    ["peak_week_key", c.peakWeekKey ?? ""].join(","),
    ["shortfall_hours", c.capacityShortfallHours].join(","),
    ["imbalance_score", c.imbalanceScore].join(","),
    ["suggestion_count", c.suggestionCount].join(","),
    ["should_alert", c.shouldAlert ? "1" : "0"].join(","),
  ];
  return `${lines.join("\n")}\n`;
}

export type DeliverPeakWeekStaffingDigestResult =
  | {
      ok: true;
      deliveryId: string;
      webhookDelivered: boolean;
      slackSent: boolean;
      emailsSent: number;
      digest: PeakWeekStaffingDigestPayload;
    }
  | { ok: false; reason: string };

export async function deliverPeakWeekStaffingDigest(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    horizonDays?: number;
    supabase?: SupabaseClient;
    force?: boolean;
    scheduled?: boolean;
  },
): Promise<DeliverPeakWeekStaffingDigestResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getPeakWeekStaffingDigestOrgSettings(orgId, supabase);
  if (!settings.digestEnabled) {
    return { ok: false, reason: "Peak-week staffing digest disabled for org." };
  }

  const pack = await buildPeakWeekStaffingDigestPack(actorUserId, {
    orgId,
    horizonDays: opts.horizonDays,
    orgName: opts.orgName,
    supabase,
  });
  if (!pack) return { ok: false, reason: "Could not build staffing digest." };

  if (!pack.coincidence.shouldAlert) {
    return { ok: false, reason: pack.coincidence.alertReason };
  }

  const peakWeekKey = pack.coincidence.peakWeekKey!;
  if (!opts.force && (await wasPeakWeekStaffingDelivered(orgId, peakWeekKey, supabase))) {
    return { ok: false, reason: "Digest already delivered for this peak week." };
  }

  const digest = buildPeakWeekStaffingDigestPayload(
    {
      orgId,
      generatedAt: pack.generatedAt,
      horizonDays: pack.horizonDays,
      coincidence: pack.coincidence,
      capacity: pack.capacity,
      loadBalance: pack.loadBalance,
    },
    opts.siteOrigin,
  );

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");
  const markdown = pack.digestPreviewMarkdown;

  let webhookDelivered = false;
  let slackSent = false;
  let emailsSent = 0;

  if (settings.webhookUrl) {
    const webhook = await deliverHttpsJsonWebhook(settings.webhookUrl, digest);
    webhookDelivered = webhook.ok;
  }

  if (isSlackWebhookConfigured()) {
    const origin = opts.siteOrigin.replace(/\/$/, "");
    const result = await sendSlackNotificationWithAudit({
      userId: actorUserId,
      title: `Peak-week staffing alert — ${orgName}`,
      body: pack.coincidence.alertReason,
      details: [
        `Shortfall: ${pack.coincidence.capacityShortfallHours}h`,
        `Imbalance: ${pack.coincidence.imbalanceScore}`,
        `Suggestions: ${pack.coincidence.suggestionCount}`,
        `<${origin}/governance/compliance/peak-week-staffing-digest|Staffing digest>`,
        `<${origin}/governance/compliance/committee-capacity-budget|Capacity budget>`,
        `<${origin}/governance/compliance/obligation-load-balancing|Load balancing>`,
      ],
      kind: "peak_week_staffing",
      auditDetails: {
        org_id: orgId,
        peak_week_key: peakWeekKey,
        shortfall_hours: pack.coincidence.capacityShortfallHours,
      },
    });
    slackSent = result.ok;
  }

  if (settings.emailEnabled && isTransactionalEmailConfigured()) {
    const members = await listOrgMembers(orgId, { supabase });
    const recipients = members.filter(
      (m) => MEMBER_ADMIN_ROLES.includes(m.role) && m.email?.trim(),
    );

    for (const recipient of recipients) {
      const sent = await sendTransactionalEmailWithAudit({
        to: recipient.email!.trim(),
        subject: `[Smohix] Peak-week staffing digest — ${orgName}`,
        text: markdown,
        userId: actorUserId,
        orgId,
        auditDetails: {
          event: "governance.peak_week_staffing_digest_emailed",
          recipient_role: recipient.role,
          peak_week_key: peakWeekKey,
        },
      });
      if (sent.ok) emailsSent += 1;
    }
  }

  const deliveryStatus =
    webhookDelivered || slackSent || emailsSent > 0 ? "delivered" : "recorded_no_channel";

  const { data: delivery, error } = await supabase
    .from("compliance_peak_week_staffing_digest_deliveries")
    .insert({
      org_id: orgId,
      peak_week_key: peakWeekKey,
      shortfall_hours: pack.coincidence.capacityShortfallHours,
      imbalance_score: pack.coincidence.imbalanceScore,
      suggestion_count: pack.coincidence.suggestionCount,
      delivery_status: deliveryStatus,
      delivery_note: `webhook=${webhookDelivered}; slack=${slackSent}; emails=${emailsSent}`,
    })
    .select("id")
    .single();

  if (error || !delivery) {
    return { ok: false, reason: error?.message ?? "delivery_log_failed" };
  }

  await appendAuditEvent({
    event_type: "governance.peak_week_staffing_digest_delivered",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      delivery_id: delivery.id,
      peak_week_key: peakWeekKey,
      shortfall_hours: pack.coincidence.capacityShortfallHours,
      imbalance_score: pack.coincidence.imbalanceScore,
      webhook_delivered: webhookDelivered,
      slack_sent: slackSent,
      emails_sent: emailsSent,
      scheduled: Boolean(opts.scheduled),
    },
  });

  return {
    ok: true,
    deliveryId: String(delivery.id),
    webhookDelivered,
    slackSent,
    emailsSent,
    digest,
  };
}
