import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  collectStaffingSlaBreachActions,
  getStaffingSlaBreachDigestOrgSettings,
  type StaffingSlaBreachItem,
} from "@/lib/compliance/staffing-action-sla-breach-digest";
import { listStaffingActions } from "@/lib/compliance/obligation-staffing-action-tracker";
import { staffingCompletionPeriodKey } from "@/lib/compliance/staffing-completion-rollup";
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

export const CROSS_STAFFING_COMMITTEE_ESCALATION_VERSION =
  "smohix-cross-staffing-committee-escalation/1";

export type CrossStaffingEscalationOrgSettings = {
  escalationEnabled: boolean;
  emailEnabled: boolean;
  slaDaysAfterPeakWeek: number;
};

export type RollupDeliverySnapshot = {
  id: string;
  periodKey: string;
  openCount: number;
  trackedCount: number;
  completionPercent: number;
  emailsSent: number;
  deliveryStatus: string;
};

export type CrossStaffingCommitteeEscalationPack = {
  version: typeof CROSS_STAFFING_COMMITTEE_ESCALATION_VERSION;
  generatedAt: string;
  orgId: string | null;
  periodKey: string;
  settings: CrossStaffingEscalationOrgSettings;
  breachItems: StaffingSlaBreachItem[];
  rollupDelivery: RollupDeliverySnapshot | null;
  escalationEligible: boolean;
  maxDaysPastPeak: number;
  committeeSummary: string;
  lastDeliveryAt: string | null;
};

export type CrossStaffingEscalationDeliveryRow = {
  id: string;
  periodKey: string;
  rollupDeliveryId: string | null;
  rollupOpenCount: number;
  slaDaysAfterPeakWeek: number;
  breachCount: number;
  maxDaysPastPeak: number;
  emailsSent: number;
  slackSent: boolean;
  deliveryStatus: string;
  createdAt: string;
};

export function crossStaffingEscalationPeriodKey(now = new Date()): string {
  return staffingCompletionPeriodKey(now);
}

export async function getRollupDeliveryForPeriod(
  orgId: string,
  periodKey: string,
  supabase: SupabaseClient,
): Promise<RollupDeliverySnapshot | null> {
  const { data } = await supabase
    .from("compliance_staffing_completion_rollup_deliveries")
    .select(
      "id, period_key, open_count, tracked_count, completion_percent, emails_sent, delivery_status",
    )
    .eq("org_id", orgId)
    .eq("period_key", periodKey)
    .maybeSingle();

  if (!data?.id) return null;

  return {
    id: String(data.id),
    periodKey: String(data.period_key),
    openCount: Number(data.open_count) || 0,
    trackedCount: Number(data.tracked_count) || 0,
    completionPercent: Number(data.completion_percent) || 0,
    emailsSent: Number(data.emails_sent) || 0,
    deliveryStatus: String(data.delivery_status),
  };
}

export function buildCrossStaffingCommitteeEscalationFromParts(input: {
  orgId: string | null;
  settings: CrossStaffingEscalationOrgSettings;
  breachItems: StaffingSlaBreachItem[];
  rollupDelivery: RollupDeliverySnapshot | null;
  periodKey: string;
  now?: Date;
  generatedAt?: string;
  lastDeliveryAt?: string | null;
}): CrossStaffingCommitteeEscalationPack {
  const now = input.now ?? new Date();
  const maxDaysPastPeak =
    input.breachItems.length === 0 ? 0 : input.breachItems[0]!.daysPastPeakWeek;

  const rollupSent =
    input.rollupDelivery != null &&
    input.rollupDelivery.deliveryStatus === "sent" &&
    input.rollupDelivery.emailsSent > 0;

  const escalationEligible =
    input.settings.escalationEnabled && rollupSent && input.breachItems.length > 0;

  let committeeSummary: string;
  if (!input.settings.escalationEnabled) {
    committeeSummary = "Cross-staffing committee escalation is disabled for this organization.";
  } else if (!input.rollupDelivery) {
    committeeSummary =
      "Completion rollup has not been delivered for this UTC week — escalation waits until the committee archive email is sent.";
  } else if (!rollupSent) {
    committeeSummary =
      "Completion rollup exists for this week but was not emailed — escalation requires a sent rollup delivery.";
  } else if (input.breachItems.length === 0) {
    committeeSummary = `Rollup reported ${input.rollupDelivery.openCount} open action(s) at delivery — no SLA breaches remain; escalation not required.`;
  } else {
    committeeSummary = `${input.breachItems.length} staffing action(s) still breach the ${input.settings.slaDaysAfterPeakWeek}-day SLA after the completion rollup email (rollup had ${input.rollupDelivery.openCount} open) — escalate to committee admins.`;
  }

  return {
    version: CROSS_STAFFING_COMMITTEE_ESCALATION_VERSION,
    generatedAt: input.generatedAt ?? now.toISOString(),
    orgId: input.orgId,
    periodKey: input.periodKey,
    settings: input.settings,
    breachItems: input.breachItems,
    rollupDelivery: input.rollupDelivery,
    escalationEligible,
    maxDaysPastPeak,
    committeeSummary,
    lastDeliveryAt: input.lastDeliveryAt ?? null,
  };
}

export async function getCrossStaffingEscalationOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<CrossStaffingEscalationOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const [escalationRow, slaSettings] = await Promise.all([
    client
      .from("organizations")
      .select(
        "compliance_cross_staffing_escalation_enabled, compliance_cross_staffing_escalation_email_enabled",
      )
      .eq("id", orgId)
      .maybeSingle(),
    getStaffingSlaBreachDigestOrgSettings(orgId, client),
  ]);

  return {
    escalationEnabled: escalationRow.data?.compliance_cross_staffing_escalation_enabled !== false,
    emailEnabled:
      escalationRow.data?.compliance_cross_staffing_escalation_email_enabled !== false,
    slaDaysAfterPeakWeek: slaSettings.slaDaysAfterPeakWeek,
  };
}

export async function updateCrossStaffingEscalationOrgSettings(
  orgId: string,
  input: Partial<Pick<CrossStaffingEscalationOrgSettings, "escalationEnabled" | "emailEnabled">>,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {};
  if (input.escalationEnabled !== undefined) {
    patch.compliance_cross_staffing_escalation_enabled = input.escalationEnabled;
  }
  if (input.emailEnabled !== undefined) {
    patch.compliance_cross_staffing_escalation_email_enabled = input.emailEnabled;
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  return !error;
}

export async function getLastCrossStaffingEscalationDeliveryAt(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<string | null> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_cross_staffing_committee_escalation_deliveries")
    .select("created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? String(data.created_at) : null;
}

export async function listCrossStaffingEscalationDeliveries(
  orgId: string,
  opts?: { supabase?: SupabaseClient; limit?: number },
): Promise<CrossStaffingEscalationDeliveryRow[]> {
  const client = opts?.supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_cross_staffing_committee_escalation_deliveries")
    .select(
      "id, period_key, rollup_delivery_id, rollup_open_count, sla_days_after_peak_week, breach_count, max_days_past_peak, emails_sent, slack_sent, delivery_status, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 10);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    periodKey: String(row.period_key),
    rollupDeliveryId: row.rollup_delivery_id ? String(row.rollup_delivery_id) : null,
    rollupOpenCount: Number(row.rollup_open_count) || 0,
    slaDaysAfterPeakWeek: Number(row.sla_days_after_peak_week) || 0,
    breachCount: Number(row.breach_count) || 0,
    maxDaysPastPeak: Number(row.max_days_past_peak) || 0,
    emailsSent: Number(row.emails_sent) || 0,
    slackSent: Boolean(row.slack_sent),
    deliveryStatus: String(row.delivery_status),
    createdAt: String(row.created_at),
  }));
}

async function wasCrossStaffingEscalationDelivered(
  orgId: string,
  periodKey: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_cross_staffing_committee_escalation_deliveries")
    .select("id")
    .eq("org_id", orgId)
    .eq("period_key", periodKey)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function buildCrossStaffingCommitteeEscalationPack(
  userId: string,
  opts: { orgId: string | null; supabase?: SupabaseClient; now?: Date },
): Promise<CrossStaffingCommitteeEscalationPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const now = opts.now ?? new Date();
  const periodKey = crossStaffingEscalationPeriodKey(now);

  const [actions, settings, rollupDelivery, lastDeliveryAt] = await Promise.all([
    listStaffingActions(opts.orgId, supabase),
    getCrossStaffingEscalationOrgSettings(opts.orgId, supabase),
    getRollupDeliveryForPeriod(opts.orgId, periodKey, supabase),
    getLastCrossStaffingEscalationDeliveryAt(opts.orgId, supabase),
  ]);

  const breachItems = collectStaffingSlaBreachActions(
    actions,
    settings.slaDaysAfterPeakWeek,
    now,
  );

  return buildCrossStaffingCommitteeEscalationFromParts({
    orgId: opts.orgId,
    settings,
    breachItems,
    rollupDelivery,
    periodKey,
    now,
    lastDeliveryAt,
  });
}

export function crossStaffingEscalationToCsv(
  pack: CrossStaffingCommitteeEscalationPack,
): string {
  const lines = [
    "action_id,title,status,peak_week_key,days_past_peak_week,days_past_sla,rollup_open_count,period_key",
    ...pack.breachItems.map((i) =>
      [
        i.action.id,
        JSON.stringify(i.action.title),
        i.action.status,
        i.action.peakWeekKey ?? "",
        i.daysPastPeakWeek,
        i.daysPastSla,
        pack.rollupDelivery?.openCount ?? "",
        pack.periodKey,
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

export type DeliverCrossStaffingEscalationResult =
  | {
      ok: true;
      pack: CrossStaffingCommitteeEscalationPack;
      emailsSent: number;
      slackSent: boolean;
    }
  | { ok: false; reason: string };

export async function deliverCrossStaffingCommitteeEscalation(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    supabase?: SupabaseClient;
    force?: boolean;
    scheduled?: boolean;
    now?: Date;
  },
): Promise<DeliverCrossStaffingEscalationResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const now = opts.now ?? new Date();
  const settings = await getCrossStaffingEscalationOrgSettings(orgId, supabase);
  if (!settings.escalationEnabled) {
    return { ok: false, reason: "Cross-staffing committee escalation disabled for org." };
  }

  const pack = await buildCrossStaffingCommitteeEscalationPack(actorUserId, {
    orgId,
    supabase,
    now,
  });
  if (!pack) return { ok: false, reason: "Could not build escalation pack." };

  if (!pack.escalationEligible) {
    return { ok: false, reason: pack.committeeSummary };
  }

  const periodKey = pack.periodKey;
  if (!opts.force && (await wasCrossStaffingEscalationDelivered(orgId, periodKey, supabase))) {
    return { ok: false, reason: "Committee escalation already delivered this week." };
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");
  const origin = opts.siteOrigin.replace(/\/$/, "");
  const rollupOpen = pack.rollupDelivery?.openCount ?? 0;

  let emailsSent = 0;
  let slackSent = false;

  if (settings.emailEnabled && isTransactionalEmailConfigured()) {
    const members = await listOrgMembers(orgId, { supabase });
    const recipients = members.filter(
      (m) => MEMBER_ADMIN_ROLES.includes(m.role) && m.email?.trim(),
    );

    const lines = [
      `${SITE_BRAND_NAME} cross-staffing committee escalation for ${orgName}:`,
      "",
      pack.committeeSummary,
      "",
      `Completion rollup (this week) reported ${rollupOpen} open action(s) before this escalation.`,
      `SLA: ${settings.slaDaysAfterPeakWeek} day(s) after peak week end`,
      "",
    ];
    for (const item of pack.breachItems.slice(0, 20)) {
      lines.push(
        `- [${item.action.status}] ${item.action.title} (+${item.daysPastPeakWeek}d past peak, +${item.daysPastSla}d past SLA)`,
      );
    }
    if (pack.breachItems.length > 20) {
      lines.push(`… and ${pack.breachItems.length - 20} more breach(es).`);
    }
    lines.push(
      "",
      `Console: ${origin}/governance/compliance/cross-staffing-committee-escalation`,
      `Staffing tracker: ${origin}/governance/compliance/staffing-actions`,
    );

    for (const admin of recipients) {
      const sent = await sendTransactionalEmailWithAudit({
        to: admin.email!.trim(),
        subject: `[Smohix] Committee escalation — ${orgName} (${pack.breachItems.length} SLA breach(es) after rollup)`,
        text: lines.join("\n"),
        userId: actorUserId,
        orgId,
        auditDetails: {
          event: "governance.cross_staffing_committee_escalation_emailed",
          breach_count: pack.breachItems.length,
          rollup_open_count: rollupOpen,
        },
      });
      if (sent.ok) emailsSent += 1;
    }
  }

  if (isSlackWebhookConfigured()) {
    const slackLines = pack.breachItems
      .slice(0, 12)
      .map(
        (i) =>
          `• ${i.action.title} (${i.action.status}, +${i.daysPastPeakWeek}d, SLA +${i.daysPastSla}d)`,
      );
    const result = await sendSlackNotificationWithAudit({
      userId: actorUserId,
      title: `Committee escalation — ${orgName}`,
      body: slackLines.join("\n"),
      details: [
        `Rollup had ${rollupOpen} open · ${pack.breachItems.length} still breaching SLA`,
        `<${origin}/governance/compliance/cross-staffing-committee-escalation|Escalation console>`,
      ],
      kind: "cross_staffing_escalation",
      auditDetails: {
        org_id: orgId,
        breach_count: pack.breachItems.length,
        rollup_open_count: rollupOpen,
      },
    });
    if (result.ok) slackSent = true;
  }

  if (emailsSent === 0 && !slackSent) {
    return { ok: false, reason: "No email or Slack delivery (check Resend/Slack configuration)." };
  }

  await supabase.from("compliance_cross_staffing_committee_escalation_deliveries").insert({
    org_id: orgId,
    period_key: periodKey,
    rollup_delivery_id: pack.rollupDelivery?.id ?? null,
    rollup_open_count: rollupOpen,
    sla_days_after_peak_week: settings.slaDaysAfterPeakWeek,
    breach_count: pack.breachItems.length,
    max_days_past_peak: pack.maxDaysPastPeak,
    emails_sent: emailsSent,
    slack_sent: slackSent,
    delivery_status: "sent",
    delivery_note: opts.scheduled ? "scheduled" : "manual",
  });

  await appendAuditEvent({
    event_type: "governance.cross_staffing_committee_escalation_delivered",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      period_key: periodKey,
      breach_count: pack.breachItems.length,
      rollup_open_count: rollupOpen,
      rollup_delivery_id: pack.rollupDelivery?.id ?? null,
      sla_days: settings.slaDaysAfterPeakWeek,
      max_days_past_peak: pack.maxDaysPastPeak,
      emails_sent: emailsSent,
      slack_sent: slackSent,
      scheduled: Boolean(opts.scheduled),
    },
  });

  return { ok: true, pack, emailsSent, slackSent };
}
