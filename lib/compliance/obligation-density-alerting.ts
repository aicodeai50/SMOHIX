import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildBoardObligationForecastPack,
  type BoardObligationForecastPack,
} from "@/lib/compliance/board-obligation-forecast";
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

export const OBLIGATION_DENSITY_ALERTING_VERSION = "smohix-obligation-density-alerting/1";

export type ObligationDensityAlertType = "weekly_density" | "peak_week" | "overdue_spike";

export type ObligationDensityAlertOrgSettings = {
  enabled: boolean;
  weeklyThreshold: number;
  peakThreshold: number;
  overdueThreshold: number;
  emailEnabled: boolean;
};

export type ObligationDensityBreach = {
  alertType: ObligationDensityAlertType;
  alertKey: string;
  metricValue: number;
  thresholdValue: number;
  label: string;
  detail: string;
};

export type ObligationDensityAlertingPack = {
  version: typeof OBLIGATION_DENSITY_ALERTING_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  settings: ObligationDensityAlertOrgSettings;
  forecast: BoardObligationForecastPack | null;
  currentWeekCount: number;
  currentWeekKey: string | null;
  breaches: ObligationDensityBreach[];
  anyBreach: boolean;
  slackConfigured: boolean;
  emailConfigured: boolean;
};

export type ObligationDensityAlertLogRow = {
  id: string;
  orgId: string;
  alertKey: string;
  alertType: ObligationDensityAlertType;
  channel: "slack" | "email";
  recipient: string | null;
  metricValue: number;
  thresholdValue: number;
  createdAt: string;
};

export type RunObligationDensityAlertsResult =
  | {
      ok: true;
      pack: ObligationDensityAlertingPack;
      slackSent: boolean;
      emailsSent: number;
      breachesNotified: number;
    }
  | { ok: false; reason: string };

export function evaluateObligationDensityBreaches(input: {
  forecast: BoardObligationForecastPack | null;
  settings: ObligationDensityAlertOrgSettings;
}): ObligationDensityBreach[] {
  const breaches: ObligationDensityBreach[] = [];
  const forecast = input.forecast;
  if (!forecast) return breaches;

  const currentWeek = forecast.buckets.find((b) => b.isCurrentWeek);
  if (currentWeek && currentWeek.totalCount >= input.settings.weeklyThreshold) {
    breaches.push({
      alertType: "weekly_density",
      alertKey: `density:weekly:${currentWeek.weekKey}`,
      metricValue: currentWeek.totalCount,
      thresholdValue: input.settings.weeklyThreshold,
      label: "Current week density",
      detail: `${currentWeek.totalCount} obligations in week ${currentWeek.weekKey} (threshold ${input.settings.weeklyThreshold})`,
    });
  }

  if (
    forecast.peakWeekKey &&
    forecast.peakWeekCount >= input.settings.peakThreshold
  ) {
    breaches.push({
      alertType: "peak_week",
      alertKey: `density:peak:${forecast.peakWeekKey}`,
      metricValue: forecast.peakWeekCount,
      thresholdValue: input.settings.peakThreshold,
      label: "Peak forecast week",
      detail: `Peak week ${forecast.peakWeekKey} has ${forecast.peakWeekCount} obligations (threshold ${input.settings.peakThreshold})`,
    });
  }

  if (
    input.settings.overdueThreshold > 0 &&
    forecast.currentOverdue >= input.settings.overdueThreshold
  ) {
    breaches.push({
      alertType: "overdue_spike",
      alertKey: `density:overdue:${forecast.generatedAt.slice(0, 10)}`,
      metricValue: forecast.currentOverdue,
      thresholdValue: input.settings.overdueThreshold,
      label: "Overdue obligations",
      detail: `${forecast.currentOverdue} overdue obligations (threshold ${input.settings.overdueThreshold})`,
    });
  }

  return breaches;
}

export function buildObligationDensityAlertingFromParts(input: {
  orgId: string | null;
  horizonDays: number;
  settings: ObligationDensityAlertOrgSettings;
  forecast: BoardObligationForecastPack | null;
  generatedAt?: string;
}): ObligationDensityAlertingPack {
  const currentWeek = input.forecast?.buckets.find((b) => b.isCurrentWeek);
  const breaches = evaluateObligationDensityBreaches({
    forecast: input.forecast,
    settings: input.settings,
  });

  return {
    version: OBLIGATION_DENSITY_ALERTING_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    settings: input.settings,
    forecast: input.forecast,
    currentWeekCount: currentWeek?.totalCount ?? 0,
    currentWeekKey: currentWeek?.weekKey ?? null,
    breaches,
    anyBreach: breaches.length > 0,
    slackConfigured: isSlackWebhookConfigured(),
    emailConfigured: isTransactionalEmailConfigured(),
  };
}

export async function getObligationDensityAlertOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<ObligationDensityAlertOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_obligation_density_alerts_enabled, compliance_obligation_density_weekly_threshold, compliance_obligation_density_peak_threshold, compliance_obligation_density_overdue_threshold, compliance_obligation_density_email_enabled",
    )
    .eq("id", orgId)
    .maybeSingle();

  return {
    enabled: data?.compliance_obligation_density_alerts_enabled !== false,
    weeklyThreshold:
      Number(data?.compliance_obligation_density_weekly_threshold ?? 8) || 8,
    peakThreshold: Number(data?.compliance_obligation_density_peak_threshold ?? 12) || 12,
    overdueThreshold:
      Number(data?.compliance_obligation_density_overdue_threshold ?? 3) || 3,
    emailEnabled: data?.compliance_obligation_density_email_enabled !== false,
  };
}

export async function updateObligationDensityAlertOrgSettings(
  orgId: string,
  input: Partial<ObligationDensityAlertOrgSettings>,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {};
  if (input.enabled !== undefined) {
    patch.compliance_obligation_density_alerts_enabled = input.enabled;
  }
  if (input.weeklyThreshold !== undefined) {
    patch.compliance_obligation_density_weekly_threshold = input.weeklyThreshold;
  }
  if (input.peakThreshold !== undefined) {
    patch.compliance_obligation_density_peak_threshold = input.peakThreshold;
  }
  if (input.overdueThreshold !== undefined) {
    patch.compliance_obligation_density_overdue_threshold = input.overdueThreshold;
  }
  if (input.emailEnabled !== undefined) {
    patch.compliance_obligation_density_email_enabled = input.emailEnabled;
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  return !error;
}

export async function listObligationDensityAlertLog(
  orgId: string,
  opts?: { supabase?: SupabaseClient; limit?: number },
): Promise<ObligationDensityAlertLogRow[]> {
  const client = opts?.supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_obligation_density_alert_log")
    .select(
      "id, org_id, alert_key, alert_type, channel, recipient, metric_value, threshold_value, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 20);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    orgId: String(row.org_id),
    alertKey: String(row.alert_key),
    alertType: row.alert_type as ObligationDensityAlertType,
    channel: row.channel as "slack" | "email",
    recipient: row.recipient ? String(row.recipient) : null,
    metricValue: Number(row.metric_value) || 0,
    thresholdValue: Number(row.threshold_value) || 0,
    createdAt: String(row.created_at),
  }));
}

async function wasDensityAlertSent(
  orgId: string,
  alertKey: string,
  channel: "slack" | "email",
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_obligation_density_alert_log")
    .select("id")
    .eq("org_id", orgId)
    .eq("alert_key", alertKey)
    .eq("channel", channel)
    .maybeSingle();
  return Boolean(data?.id);
}

async function logDensityAlertSent(
  orgId: string,
  breach: ObligationDensityBreach,
  channel: "slack" | "email",
  recipient: string | null,
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.from("compliance_obligation_density_alert_log").insert({
    org_id: orgId,
    alert_key: breach.alertKey,
    alert_type: breach.alertType,
    channel,
    recipient,
    metric_value: breach.metricValue,
    threshold_value: breach.thresholdValue,
  });
}

function buildSlackDensityAlert(
  orgName: string,
  breaches: ObligationDensityBreach[],
  siteOrigin: string,
): { title: string; body: string; details: string[] } {
  const origin = siteOrigin.replace(/\/$/, "");
  const lines = breaches.map((b) => `• ${b.label}: ${b.detail}`);
  return {
    title: `Obligation density alert — ${orgName}`,
    body: lines.join("\n"),
    details: [
      `<${origin}/governance/compliance/obligation-forecast|Forecast timeline>`,
      `<${origin}/governance/compliance/obligation-density-alerts|Density alerts>`,
    ],
  };
}

function buildDensityAlertEmail(
  orgName: string,
  breaches: ObligationDensityBreach[],
  siteOrigin: string,
): { subject: string; text: string } {
  const lines = [
    `${SITE_BRAND_NAME} obligation density thresholds exceeded for ${orgName}:`,
    "",
    ...breaches.map((b) => `- ${b.detail}`),
    "",
    `Forecast: ${siteOrigin.replace(/\/$/, "")}/governance/compliance/obligation-forecast`,
    `Consolidation: ${siteOrigin.replace(/\/$/, "")}/governance/compliance/obligation-consolidation`,
  ];
  return {
    subject: `[Smohix] Obligation density alert — ${orgName}`,
    text: lines.join("\n"),
  };
}

export async function buildObligationDensityAlertingPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ObligationDensityAlertingPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? 90;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getObligationDensityAlertOrgSettings(opts.orgId, supabase);
  const forecast = await buildBoardObligationForecastPack(userId, {
    orgId: opts.orgId,
    horizonDays,
    supabase,
  });

  return buildObligationDensityAlertingFromParts({
    orgId: opts.orgId,
    horizonDays,
    settings,
    forecast,
  });
}

export function obligationDensityAlertingToCsv(pack: ObligationDensityAlertingPack): string {
  const lines = [
    "alert_type,metric,threshold,label",
    ...pack.breaches.map((b) =>
      [b.alertType, b.metricValue, b.thresholdValue, JSON.stringify(b.label)].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

export async function runObligationDensityAlertsForOrg(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    horizonDays?: number;
    supabase?: SupabaseClient;
    force?: boolean;
  },
): Promise<RunObligationDensityAlertsResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getObligationDensityAlertOrgSettings(orgId, supabase);
  if (!settings.enabled) {
    return { ok: false, reason: "Density alerts disabled for org." };
  }

  const pack = await buildObligationDensityAlertingPack(actorUserId, {
    orgId,
    horizonDays: opts.horizonDays ?? 90,
    supabase,
  });
  if (!pack) return { ok: false, reason: "Could not build density pack." };

  if (pack.breaches.length === 0) {
    return { ok: false, reason: "No density thresholds exceeded." };
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");

  const pendingBreaches: ObligationDensityBreach[] = [];
  for (const breach of pack.breaches) {
    const slackSent = await wasDensityAlertSent(orgId, breach.alertKey, "slack", supabase);
    const emailSent = await wasDensityAlertSent(orgId, breach.alertKey, "email", supabase);
    if (opts.force || !slackSent || !emailSent) {
      pendingBreaches.push(breach);
    }
  }

  if (pendingBreaches.length === 0) {
    return { ok: false, reason: "Alerts already sent for current breaches." };
  }

  let slackSent = false;
  let emailsSent = 0;

  const slackKey = `density:slack:${pendingBreaches.map((b) => b.alertKey).join("|")}`;
  const slackAlready = opts.force
    ? false
    : await wasDensityAlertSent(orgId, slackKey, "slack", supabase);

  if (!slackAlready && isSlackWebhookConfigured()) {
    const summary = buildSlackDensityAlert(orgName, pendingBreaches, opts.siteOrigin);
    const result = await sendSlackNotificationWithAudit({
      userId: actorUserId,
      title: summary.title,
      body: summary.body,
      details: summary.details,
      kind: "obligation_density",
      auditDetails: { org_id: orgId, breach_count: pendingBreaches.length },
    });
    if (result.ok) {
      slackSent = true;
      await logDensityAlertSent(
        orgId,
        {
          alertType: "weekly_density",
          alertKey: slackKey,
          metricValue: pack.currentWeekCount,
          thresholdValue: settings.weeklyThreshold,
          label: "Slack batch",
          detail: summary.body.slice(0, 200),
        },
        "slack",
        null,
        supabase,
      );
    }
  }

  if (settings.emailEnabled && isTransactionalEmailConfigured()) {
    const email = buildDensityAlertEmail(orgName, pendingBreaches, opts.siteOrigin);
    const members = await listOrgMembers(orgId, { supabase });
    const recipients = members.filter(
      (m) => MEMBER_ADMIN_ROLES.includes(m.role) && m.email?.trim(),
    );

    for (const member of recipients) {
      const sent = await sendTransactionalEmailWithAudit({
        to: member.email!.trim(),
        subject: email.subject,
        text: email.text,
        userId: actorUserId,
        orgId,
        auditDetails: {
          event: "governance.obligation_density_alert_emailed",
          recipient_role: member.role,
          breach_count: pendingBreaches.length,
        },
      });
      if (sent.ok) {
        emailsSent += 1;
        for (const breach of pendingBreaches) {
          const already = await wasDensityAlertSent(orgId, breach.alertKey, "email", supabase);
          if (opts.force || !already) {
            await logDensityAlertSent(
              orgId,
              breach,
              "email",
              member.email!.trim(),
              supabase,
            );
          }
        }
      }
    }
  }

  if (slackSent) {
    for (const breach of pendingBreaches) {
      const already = await wasDensityAlertSent(orgId, breach.alertKey, "slack", supabase);
      if (opts.force || !already) {
        await logDensityAlertSent(orgId, breach, "slack", null, supabase);
      }
    }
  }

  await appendAuditEvent({
    event_type: "governance.obligation_density_alerts_sent",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      breach_count: pendingBreaches.length,
      slack_sent: slackSent,
      emails_sent: emailsSent,
      weekly_threshold: settings.weeklyThreshold,
      current_week_count: pack.currentWeekCount,
    },
  });

  return {
    ok: true,
    pack,
    slackSent,
    emailsSent,
    breachesNotified: pendingBreaches.length,
  };
}
