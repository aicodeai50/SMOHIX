import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  daysPastPeakWeek,
  endOfUtcWeekIso,
  isStaffingActionOverdue,
} from "@/lib/compliance/staffing-action-overdue-reminders";
import {
  listStaffingActions,
  type StaffingActionRow,
  type StaffingActionStatus,
} from "@/lib/compliance/obligation-staffing-action-tracker";
import { startOfUtcWeek } from "@/lib/compliance/board-obligation-forecast";
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

export const STAFFING_ACTION_SLA_BREACH_DIGEST_VERSION =
  "zentro-staffing-action-sla-breach-digest/1";

export const DEFAULT_STAFFING_SLA_DAYS_AFTER_PEAK_WEEK = 7;

const OPEN_STATUSES: StaffingActionStatus[] = ["accepted", "in_progress"];

export type StaffingSlaBreachDigestOrgSettings = {
  digestEnabled: boolean;
  emailEnabled: boolean;
  slaDaysAfterPeakWeek: number;
};

export type StaffingSlaBreachItem = {
  action: StaffingActionRow;
  peakWeekEnd: string;
  daysPastPeakWeek: number;
  daysPastSla: number;
};

export type StaffingSlaBreachDigestPack = {
  version: typeof STAFFING_ACTION_SLA_BREACH_DIGEST_VERSION;
  generatedAt: string;
  orgId: string | null;
  settings: StaffingSlaBreachDigestOrgSettings;
  breachItems: StaffingSlaBreachItem[];
  openActionCount: number;
  overdueNotYetBreachCount: number;
  maxDaysPastPeak: number;
  committeeSummary: string;
  lastDeliveryAt: string | null;
};

export type StaffingSlaBreachDigestDeliveryRow = {
  id: string;
  periodKey: string;
  slaDaysAfterPeakWeek: number;
  breachCount: number;
  maxDaysPastPeak: number;
  emailsSent: number;
  slackSent: boolean;
  deliveryStatus: string;
  createdAt: string;
};

export function staffingSlaBreachPeriodKey(now = new Date()): string {
  return `week:${startOfUtcWeek(now.toISOString())}`;
}

export function isStaffingActionSlaBreach(
  action: StaffingActionRow,
  slaDaysAfterPeakWeek: number,
  now = new Date(),
): boolean {
  if (!isStaffingActionOverdue(action, now)) return false;
  const days = daysPastPeakWeek(action.peakWeekKey!, now);
  return days > slaDaysAfterPeakWeek;
}

export function collectStaffingSlaBreachActions(
  actions: StaffingActionRow[],
  slaDaysAfterPeakWeek: number,
  now = new Date(),
): StaffingSlaBreachItem[] {
  return actions
    .filter((a) => isStaffingActionSlaBreach(a, slaDaysAfterPeakWeek, now))
    .map((action) => {
      const daysPast = daysPastPeakWeek(action.peakWeekKey!, now);
      return {
        action,
        peakWeekEnd: endOfUtcWeekIso(action.peakWeekKey!),
        daysPastPeakWeek: daysPast,
        daysPastSla: daysPast - slaDaysAfterPeakWeek,
      };
    })
    .sort((a, b) => b.daysPastPeakWeek - a.daysPastPeakWeek);
}

export function buildStaffingSlaBreachDigestFromParts(input: {
  orgId: string | null;
  settings: StaffingSlaBreachDigestOrgSettings;
  actions: StaffingActionRow[];
  now?: Date;
  generatedAt?: string;
  lastDeliveryAt?: string | null;
}): StaffingSlaBreachDigestPack {
  const now = input.now ?? new Date();
  const slaDays = Math.max(0, input.settings.slaDaysAfterPeakWeek);
  const breachItems = collectStaffingSlaBreachActions(input.actions, slaDays, now);
  const openActionCount = input.actions.filter((a) => OPEN_STATUSES.includes(a.status)).length;

  const overdueItems = input.actions.filter((a) => isStaffingActionOverdue(a, now));
  const overdueNotYetBreachCount = overdueItems.filter(
    (a) => !isStaffingActionSlaBreach(a, slaDays, now),
  ).length;

  const maxDaysPastPeak =
    breachItems.length === 0 ? 0 : breachItems[0]!.daysPastPeakWeek;

  const committeeSummary =
    breachItems.length === 0
      ? overdueNotYetBreachCount > 0
        ? `${overdueNotYetBreachCount} action(s) are past peak week but within the ${slaDays}-day completion SLA — no breach digest this week.`
        : openActionCount === 0
          ? "No open staffing actions — SLA breach digest not required."
          : `All open staffing actions are within peak week or the ${slaDays}-day post-peak SLA window.`
      : `${breachItems.length} staffing action(s) exceed the ${slaDays}-day completion SLA after peak week — send the breach digest to committee admins.`;

  return {
    version: STAFFING_ACTION_SLA_BREACH_DIGEST_VERSION,
    generatedAt: input.generatedAt ?? now.toISOString(),
    orgId: input.orgId,
    settings: input.settings,
    breachItems,
    openActionCount,
    overdueNotYetBreachCount,
    maxDaysPastPeak,
    committeeSummary,
    lastDeliveryAt: input.lastDeliveryAt ?? null,
  };
}

export async function getStaffingSlaBreachDigestOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<StaffingSlaBreachDigestOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_staffing_sla_breach_digest_enabled, compliance_staffing_sla_breach_email_enabled, compliance_staffing_sla_days_after_peak_week",
    )
    .eq("id", orgId)
    .maybeSingle();

  const rawDays = Number(data?.compliance_staffing_sla_days_after_peak_week);
  const slaDaysAfterPeakWeek = Number.isFinite(rawDays)
    ? Math.max(0, Math.min(90, Math.floor(rawDays)))
    : DEFAULT_STAFFING_SLA_DAYS_AFTER_PEAK_WEEK;

  return {
    digestEnabled: data?.compliance_staffing_sla_breach_digest_enabled !== false,
    emailEnabled: data?.compliance_staffing_sla_breach_email_enabled !== false,
    slaDaysAfterPeakWeek,
  };
}

export async function updateStaffingSlaBreachDigestOrgSettings(
  orgId: string,
  input: Partial<StaffingSlaBreachDigestOrgSettings>,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {};
  if (input.digestEnabled !== undefined) {
    patch.compliance_staffing_sla_breach_digest_enabled = input.digestEnabled;
  }
  if (input.emailEnabled !== undefined) {
    patch.compliance_staffing_sla_breach_email_enabled = input.emailEnabled;
  }
  if (input.slaDaysAfterPeakWeek !== undefined) {
    patch.compliance_staffing_sla_days_after_peak_week = Math.max(
      0,
      Math.min(90, Math.floor(input.slaDaysAfterPeakWeek)),
    );
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  return !error;
}

export async function getLastStaffingSlaBreachDigestDeliveryAt(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<string | null> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_staffing_sla_breach_digest_deliveries")
    .select("created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? String(data.created_at) : null;
}

export async function listStaffingSlaBreachDigestDeliveries(
  orgId: string,
  opts?: { supabase?: SupabaseClient; limit?: number },
): Promise<StaffingSlaBreachDigestDeliveryRow[]> {
  const client = opts?.supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_staffing_sla_breach_digest_deliveries")
    .select(
      "id, period_key, sla_days_after_peak_week, breach_count, max_days_past_peak, emails_sent, slack_sent, delivery_status, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 10);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    periodKey: String(row.period_key),
    slaDaysAfterPeakWeek: Number(row.sla_days_after_peak_week) || 0,
    breachCount: Number(row.breach_count) || 0,
    maxDaysPastPeak: Number(row.max_days_past_peak) || 0,
    emailsSent: Number(row.emails_sent) || 0,
    slackSent: Boolean(row.slack_sent),
    deliveryStatus: String(row.delivery_status),
    createdAt: String(row.created_at),
  }));
}

async function wasStaffingSlaBreachDigestDelivered(
  orgId: string,
  periodKey: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_staffing_sla_breach_digest_deliveries")
    .select("id")
    .eq("org_id", orgId)
    .eq("period_key", periodKey)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function buildStaffingSlaBreachDigestPack(
  userId: string,
  opts: { orgId: string | null; supabase?: SupabaseClient },
): Promise<StaffingSlaBreachDigestPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const [actions, settings, lastDeliveryAt] = await Promise.all([
    listStaffingActions(opts.orgId, supabase),
    getStaffingSlaBreachDigestOrgSettings(opts.orgId, supabase),
    getLastStaffingSlaBreachDigestDeliveryAt(opts.orgId, supabase),
  ]);

  return buildStaffingSlaBreachDigestFromParts({
    orgId: opts.orgId,
    settings,
    actions,
    lastDeliveryAt,
  });
}

export function staffingSlaBreachDigestToCsv(pack: StaffingSlaBreachDigestPack): string {
  const lines = [
    "action_id,title,status,peak_week_key,days_past_peak_week,days_past_sla,sla_days",
    ...pack.breachItems.map((i) =>
      [
        i.action.id,
        JSON.stringify(i.action.title),
        i.action.status,
        i.action.peakWeekKey ?? "",
        i.daysPastPeakWeek,
        i.daysPastSla,
        pack.settings.slaDaysAfterPeakWeek,
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

export type DeliverStaffingSlaBreachDigestResult =
  | {
      ok: true;
      pack: StaffingSlaBreachDigestPack;
      emailsSent: number;
      slackSent: boolean;
    }
  | { ok: false; reason: string };

export async function deliverStaffingSlaBreachDigest(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    supabase?: SupabaseClient;
    force?: boolean;
    scheduled?: boolean;
  },
): Promise<DeliverStaffingSlaBreachDigestResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getStaffingSlaBreachDigestOrgSettings(orgId, supabase);
  if (!settings.digestEnabled) {
    return { ok: false, reason: "Staffing SLA breach digest disabled for org." };
  }

  const pack = await buildStaffingSlaBreachDigestPack(actorUserId, { orgId, supabase });
  if (!pack) return { ok: false, reason: "Could not build SLA breach digest." };

  if (pack.breachItems.length === 0) {
    return { ok: false, reason: pack.committeeSummary };
  }

  const periodKey = staffingSlaBreachPeriodKey();
  if (!opts.force && (await wasStaffingSlaBreachDigestDelivered(orgId, periodKey, supabase))) {
    return { ok: false, reason: "SLA breach digest already delivered this week." };
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");
  const origin = opts.siteOrigin.replace(/\/$/, "");

  let emailsSent = 0;
  let slackSent = false;

  if (settings.emailEnabled && isTransactionalEmailConfigured()) {
    const members = await listOrgMembers(orgId, { supabase });
    const recipients = members.filter(
      (m) => MEMBER_ADMIN_ROLES.includes(m.role) && m.email?.trim(),
    );

    const lines = [
      `${SITE_BRAND_NAME} staffing SLA breach digest for ${orgName}:`,
      "",
      pack.committeeSummary,
      "",
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
      `Console: ${origin}/governance/compliance/staffing-sla-breach-digest`,
      `Staffing tracker: ${origin}/governance/compliance/staffing-actions`,
    );

    for (const admin of recipients) {
      const sent = await sendTransactionalEmailWithAudit({
        to: admin.email!.trim(),
        subject: `[Zentro] Staffing SLA breach digest — ${orgName} (${pack.breachItems.length} action(s))`,
        text: lines.join("\n"),
        userId: actorUserId,
        orgId,
        auditDetails: {
          event: "governance.staffing_sla_breach_digest_emailed",
          breach_count: pack.breachItems.length,
          sla_days: settings.slaDaysAfterPeakWeek,
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
      title: `Staffing SLA breaches — ${orgName}`,
      body: slackLines.join("\n"),
      details: [
        `SLA: ${settings.slaDaysAfterPeakWeek}d after peak week`,
        `<${origin}/governance/compliance/staffing-sla-breach-digest|SLA breach digest>`,
      ],
      kind: "staffing_sla_breach",
      auditDetails: {
        org_id: orgId,
        breach_count: pack.breachItems.length,
        sla_days: settings.slaDaysAfterPeakWeek,
      },
    });
    if (result.ok) slackSent = true;
  }

  if (emailsSent === 0 && !slackSent) {
    return { ok: false, reason: "No email or Slack delivery (check Resend/Slack configuration)." };
  }

  await supabase.from("compliance_staffing_sla_breach_digest_deliveries").insert({
    org_id: orgId,
    period_key: periodKey,
    sla_days_after_peak_week: settings.slaDaysAfterPeakWeek,
    breach_count: pack.breachItems.length,
    max_days_past_peak: pack.maxDaysPastPeak,
    emails_sent: emailsSent,
    slack_sent: slackSent,
    delivery_status: "sent",
    delivery_note: opts.scheduled ? "scheduled" : "manual",
  });

  await appendAuditEvent({
    event_type: "governance.staffing_sla_breach_digest_delivered",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      period_key: periodKey,
      breach_count: pack.breachItems.length,
      sla_days: settings.slaDaysAfterPeakWeek,
      max_days_past_peak: pack.maxDaysPastPeak,
      emails_sent: emailsSent,
      slack_sent: slackSent,
      scheduled: Boolean(opts.scheduled),
    },
  });

  return { ok: true, pack, emailsSent, slackSent };
}
