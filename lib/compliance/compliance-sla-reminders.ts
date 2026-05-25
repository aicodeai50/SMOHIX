import type { SupabaseClient } from "@supabase/supabase-js";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import { buildIso27001AssessmentReport } from "@/lib/compliance/iso-assessment";
import { buildSoc2TypeIIReport } from "@/lib/compliance/type-ii-report";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmailWithAudit,
} from "@/lib/notifications/email";
import {
  isSlackWebhookConfigured,
  sendSlackNotificationWithAudit,
  type SlackNotificationKind,
} from "@/lib/integrations/slack";
import { listOrgMembers } from "@/lib/org/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SlaReminderType = "due_soon" | "overdue" | "regressed";

export type SlaDueSoonItem = {
  type: "due_soon";
  attestationId: string;
  controlRef: string;
  title: string;
  dueAt: string;
  ownerUserId: string | null;
  ownerLabel: string | null;
  daysUntilDue: number;
};

export type SlaOverdueItem = {
  type: "overdue";
  attestationId: string;
  controlRef: string;
  title: string;
  dueAt: string;
  ownerUserId: string | null;
  ownerLabel: string | null;
};

export type SlaRegressedItem = {
  type: "regressed";
  framework: "soc2" | "iso27001";
  controlRef: string;
  title: string;
  priorStatus: string;
  currentStatus: string;
};

export type ComplianceSlaReminderBundle = {
  periodId: string;
  dueSoon: SlaDueSoonItem[];
  overdue: SlaOverdueItem[];
  regressed: SlaRegressedItem[];
};

export type ComplianceSlaOrgSettings = {
  enabled: boolean;
  dueDaysBefore: number;
  emailEnabled: boolean;
};

export type RunComplianceSlaRemindersResult =
  | {
      ok: true;
      bundle: ComplianceSlaReminderBundle;
      slackSent: boolean;
      emailsSent: number;
      emailsSkipped: number;
      itemsConsidered: number;
      itemsNotified: number;
    }
  | { ok: false; reason: string };

export function currentSlaReminderPeriodId(now = new Date()): string {
  const year = now.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - start) / 86_400_000) + 1;
  const week = Math.ceil((dayOfYear + new Date(year, 0, 1).getUTCDay()) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function daysUntil(iso: string, now = new Date()): number {
  const due = new Date(iso).getTime();
  return Math.ceil((due - now.getTime()) / 86_400_000);
}

export async function getComplianceSlaOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<ComplianceSlaOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_sla_reminders_enabled, compliance_sla_due_days_before, compliance_sla_email_enabled",
    )
    .eq("id", orgId)
    .maybeSingle();

  return {
    enabled: data?.compliance_sla_reminders_enabled !== false,
    dueDaysBefore: Number(data?.compliance_sla_due_days_before ?? 7) || 7,
    emailEnabled: data?.compliance_sla_email_enabled !== false,
  };
}

export async function collectComplianceSlaReminders(
  userId: string,
  orgId: string,
  opts?: {
    dueDaysBefore?: number;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ComplianceSlaReminderBundle> {
  const periodDays = opts?.periodDays ?? 30;
  const dueDaysBefore = opts?.dueDaysBefore ?? 7;
  const supabase = opts?.supabase ?? (await createServerSupabaseClient());
  const periodId = currentSlaReminderPeriodId();

  const [attestations, soc2, iso] = await Promise.all([
    listControlAttestationBoard(userId, orgId, supabase),
    buildSoc2TypeIIReport(userId, { orgId, periodDays, supabase }),
    buildIso27001AssessmentReport(userId, { orgId, periodDays, supabase }),
  ]);

  const now = new Date();
  const dueSoon: SlaDueSoonItem[] = [];
  const overdue: SlaOverdueItem[] = [];

  for (const row of attestations) {
    if (row.status === "overdue") {
      overdue.push({
        type: "overdue",
        attestationId: row.id,
        controlRef: row.control.ref,
        title: row.control.title,
        dueAt: row.dueAt,
        ownerUserId: row.ownerUserId,
        ownerLabel: row.ownerLabel,
      });
      continue;
    }
    if (row.status === "pending") {
      const days = daysUntil(row.dueAt, now);
      if (days >= 0 && days <= dueDaysBefore) {
        dueSoon.push({
          type: "due_soon",
          attestationId: row.id,
          controlRef: row.control.ref,
          title: row.control.title,
          dueAt: row.dueAt,
          ownerUserId: row.ownerUserId,
          ownerLabel: row.ownerLabel,
          daysUntilDue: days,
        });
      }
    }
  }

  const regressed: SlaRegressedItem[] = [];
  if (soc2) {
    for (const row of soc2.controlMonitoring) {
      if (row.trend !== "regressed") continue;
      regressed.push({
        type: "regressed",
        framework: "soc2",
        controlRef: row.ref,
        title: row.title,
        priorStatus: row.priorStatus,
        currentStatus: row.currentStatus,
      });
    }
  }
  if (iso) {
    for (const row of iso.controlMonitoring) {
      if (row.trend !== "regressed") continue;
      regressed.push({
        type: "regressed",
        framework: "iso27001",
        controlRef: row.ref,
        title: row.title,
        priorStatus: row.priorStatus,
        currentStatus: row.currentStatus,
      });
    }
  }

  return { periodId, dueSoon, overdue, regressed };
}

function reminderKey(
  periodId: string,
  item: SlaDueSoonItem | SlaOverdueItem | SlaRegressedItem,
): string {
  if (item.type === "regressed") {
    return `${periodId}:regressed:${item.framework}:${item.controlRef}`;
  }
  return `${periodId}:${item.type}:${item.attestationId}`;
}

async function wasReminderSent(
  orgId: string,
  reminderKeyValue: string,
  channel: "slack" | "email",
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_sla_reminder_log")
    .select("id")
    .eq("org_id", orgId)
    .eq("reminder_key", reminderKeyValue)
    .eq("channel", channel)
    .maybeSingle();
  return Boolean(data?.id);
}

async function logReminderSent(
  orgId: string,
  input: {
    reminderKey: string;
    reminderType: SlaReminderType;
    channel: "slack" | "email";
    recipient?: string | null;
  },
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.from("compliance_sla_reminder_log").insert({
    org_id: orgId,
    reminder_key: input.reminderKey,
    reminder_type: input.reminderType,
    channel: input.channel,
    recipient: input.recipient ?? null,
  });
}

function buildSlackSummary(orgName: string, bundle: ComplianceSlaReminderBundle, siteOrigin: string): {
  title: string;
  body: string;
  details: string[];
} {
  const origin = siteOrigin.replace(/\/$/, "");
  const lines: string[] = [];
  if (bundle.dueSoon.length > 0) {
    lines.push(`${bundle.dueSoon.length} attestation(s) due within the SLA window`);
    for (const item of bundle.dueSoon.slice(0, 5)) {
      lines.push(
        `• ${item.controlRef} — ${item.title} (${item.daysUntilDue}d)${item.ownerLabel ? ` · ${item.ownerLabel}` : ""}`,
      );
    }
  }
  if (bundle.overdue.length > 0) {
    lines.push(`${bundle.overdue.length} overdue attestation(s)`);
    for (const item of bundle.overdue.slice(0, 5)) {
      lines.push(`• ${item.controlRef} — ${item.title}${item.ownerLabel ? ` · ${item.ownerLabel}` : ""}`);
    }
  }
  if (bundle.regressed.length > 0) {
    lines.push(`${bundle.regressed.length} control(s) regressed in readiness (30d window)`);
    for (const item of bundle.regressed.slice(0, 5)) {
      lines.push(
        `• ${item.framework === "soc2" ? "SOC 2" : "ISO"} ${item.controlRef} — ${item.priorStatus} → ${item.currentStatus}`,
      );
    }
  }

  return {
    title: `Compliance SLA reminders — ${orgName}`,
    body: lines.length > 0 ? lines.join("\n") : "No SLA items this period.",
    details: [
      `<${origin}/governance/compliance/attestations|Attestation board>`,
      `<${origin}/governance/compliance/program|Program dashboard>`,
    ],
  };
}

function buildOwnerEmailBody(
  orgName: string,
  recipientName: string,
  items: { dueSoon: SlaDueSoonItem[]; overdue: SlaOverdueItem[] },
  siteOrigin: string,
): { subject: string; text: string } {
  const lines = [
    `Hi ${recipientName},`,
    "",
    `Compliance SLA reminders for ${orgName}:`,
    "",
  ];
  if (items.dueSoon.length > 0) {
    lines.push("Approaching due date:");
    for (const item of items.dueSoon) {
      lines.push(`- ${item.controlRef} ${item.title} (due ${item.dueAt.slice(0, 10)}, ${item.daysUntilDue}d)`);
    }
    lines.push("");
  }
  if (items.overdue.length > 0) {
    lines.push("Overdue:");
    for (const item of items.overdue) {
      lines.push(`- ${item.controlRef} ${item.title} (was due ${item.dueAt.slice(0, 10)})`);
    }
    lines.push("");
  }
  lines.push(`Open attestations: ${siteOrigin.replace(/\/$/, "")}/governance/compliance/attestations`);
  return {
    subject: `[Zentro] Compliance SLA reminders — ${orgName}`,
    text: lines.join("\n"),
  };
}

function buildRegressedEmailBody(
  orgName: string,
  regressed: SlaRegressedItem[],
  siteOrigin: string,
): { subject: string; text: string } {
  const lines = [
    `Compliance controls regressed in readiness for ${orgName} (30-day monitoring window):`,
    "",
  ];
  for (const item of regressed.slice(0, 12)) {
    lines.push(
      `- ${item.framework === "soc2" ? "SOC 2" : "ISO 27001"} ${item.controlRef} ${item.title}: ${item.priorStatus} → ${item.currentStatus}`,
    );
  }
  lines.push("", `Program dashboard: ${siteOrigin.replace(/\/$/, "")}/governance/compliance/program`);
  return {
    subject: `[Zentro] Control readiness regression — ${orgName}`,
    text: lines.join("\n"),
  };
}

export async function runComplianceSlaRemindersForOrg(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    supabase?: SupabaseClient;
    scheduled?: boolean;
  },
): Promise<RunComplianceSlaRemindersResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getComplianceSlaOrgSettings(orgId, supabase);
  if (!settings.enabled) {
    return { ok: false, reason: "SLA reminders disabled for organization." };
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");

  const bundle = await collectComplianceSlaReminders(actorUserId, orgId, {
    dueDaysBefore: settings.dueDaysBefore,
    supabase,
  });

  const itemsConsidered = bundle.dueSoon.length + bundle.overdue.length + bundle.regressed.length;
  if (itemsConsidered === 0) {
    return {
      ok: true,
      bundle,
      slackSent: false,
      emailsSent: 0,
      emailsSkipped: 0,
      itemsConsidered: 0,
      itemsNotified: 0,
    };
  }

  let itemsNotified = 0;
  let slackSent = false;
  let emailsSent = 0;
  let emailsSkipped = 0;

  const hasNewSlackItems = await (async () => {
    for (const item of [...bundle.dueSoon, ...bundle.overdue, ...bundle.regressed]) {
      const key = reminderKey(bundle.periodId, item);
      if (!(await wasReminderSent(orgId, key, "slack", supabase))) return true;
    }
    return false;
  })();

  if (hasNewSlackItems && isSlackWebhookConfigured()) {
    const summary = buildSlackSummary(orgName, bundle, opts.siteOrigin);
    const slackResult = await sendSlackNotificationWithAudit({
      userId: actorUserId,
      title: summary.title,
      body: summary.body,
      details: summary.details,
      kind: "compliance_sla" as SlackNotificationKind,
      auditDetails: {
        org_id: orgId,
        period_id: bundle.periodId,
        due_soon: bundle.dueSoon.length,
        overdue: bundle.overdue.length,
        regressed: bundle.regressed.length,
        scheduled: Boolean(opts.scheduled),
      },
    });
    if (slackResult.ok) {
      slackSent = true;
      for (const item of [...bundle.dueSoon, ...bundle.overdue, ...bundle.regressed]) {
        const key = reminderKey(bundle.periodId, item);
        if (await wasReminderSent(orgId, key, "slack", supabase)) continue;
        await logReminderSent(
          orgId,
          {
            reminderKey: key,
            reminderType: item.type,
            channel: "slack",
          },
          supabase,
        );
        itemsNotified += 1;
      }
    }
  }

  const emailConfigured = isTransactionalEmailConfigured();
  if (settings.emailEnabled && emailConfigured) {
    const members = await listOrgMembers(orgId, { supabase });
    const adminEmails = members
      .filter((m) => m.role === "owner" || m.role === "admin")
      .map((m) => m.email)
      .filter((e): e is string => Boolean(e));

    const byOwner = new Map<string, { dueSoon: SlaDueSoonItem[]; overdue: SlaOverdueItem[] }>();
    for (const item of [...bundle.dueSoon, ...bundle.overdue]) {
      const ownerId = item.ownerUserId;
      const bucket = byOwner.get(ownerId ?? "__unassigned__") ?? { dueSoon: [], overdue: [] };
      if (item.type === "due_soon") bucket.dueSoon.push(item);
      else bucket.overdue.push(item);
      byOwner.set(ownerId ?? "__unassigned__", bucket);
    }

    for (const [ownerKey, items] of byOwner) {
      if (items.dueSoon.length === 0 && items.overdue.length === 0) continue;

      let recipientEmail: string | null = null;
      let recipientName = "there";
      if (ownerKey !== "__unassigned__") {
        const owner = members.find((m) => m.userId === ownerKey);
        recipientEmail = owner?.email ?? null;
        recipientName = owner?.displayName ?? owner?.email ?? "Owner";
      } else {
        recipientEmail = adminEmails[0] ?? null;
        recipientName = "Admin";
      }
      if (!recipientEmail) {
        emailsSkipped += 1;
        continue;
      }

      const needsSend = await (async () => {
        for (const item of [...items.dueSoon, ...items.overdue]) {
          const key = reminderKey(bundle.periodId, item);
          if (!(await wasReminderSent(orgId, key, "email", supabase))) return true;
        }
        return false;
      })();
      if (!needsSend) continue;

      const mail = buildOwnerEmailBody(orgName, recipientName, items, opts.siteOrigin);
      const emailResult = await sendTransactionalEmailWithAudit({
        userId: actorUserId,
        orgId,
        to: recipientEmail,
        subject: mail.subject,
        text: mail.text,
        auditDetails: {
          kind: "compliance_sla",
          period_id: bundle.periodId,
          due_soon: items.dueSoon.length,
          overdue: items.overdue.length,
        },
      });

      if (emailResult.ok) {
        emailsSent += 1;
        for (const item of [...items.dueSoon, ...items.overdue]) {
          const key = reminderKey(bundle.periodId, item);
          if (await wasReminderSent(orgId, key, "email", supabase)) continue;
          await logReminderSent(
            orgId,
            {
              reminderKey: key,
              reminderType: item.type,
              channel: "email",
              recipient: recipientEmail,
            },
            supabase,
          );
          itemsNotified += 1;
        }
      } else {
        emailsSkipped += 1;
      }
    }

    if (bundle.regressed.length > 0) {
      const regressedKey = `${bundle.periodId}:regressed:summary`;
      const regressedAlready = await wasReminderSent(orgId, regressedKey, "email", supabase);
      if (!regressedAlready) {
        for (const email of [...new Set(adminEmails)]) {
          const mail = buildRegressedEmailBody(orgName, bundle.regressed, opts.siteOrigin);
          const emailResult = await sendTransactionalEmailWithAudit({
            userId: actorUserId,
            orgId,
            to: email,
            subject: mail.subject,
            text: mail.text,
            auditDetails: {
              kind: "compliance_sla_regressed",
              period_id: bundle.periodId,
              regressed: bundle.regressed.length,
            },
          });
          if (emailResult.ok) emailsSent += 1;
          else emailsSkipped += 1;
        }
        await logReminderSent(
          orgId,
          {
            reminderKey: regressedKey,
            reminderType: "regressed",
            channel: "email",
            recipient: adminEmails.join(","),
          },
          supabase,
        );
        itemsNotified += bundle.regressed.length;
      }
    }
  } else if (settings.emailEnabled) {
    emailsSkipped = itemsConsidered;
  }

  return {
    ok: true,
    bundle,
    slackSent,
    emailsSent,
    emailsSkipped,
    itemsConsidered,
    itemsNotified,
  };
}

export async function listComplianceSlaReminderLog(
  orgId: string,
  opts?: { limit?: number; supabase?: SupabaseClient },
): Promise<
  {
    id: string;
    reminderType: string;
    channel: string;
    recipient: string | null;
    createdAt: string;
  }[]
> {
  if (!hasSupabaseAuth() || !orgId) return [];
  try {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const { data } = await supabase
      .from("compliance_sla_reminder_log")
      .select("id, reminder_type, channel, recipient, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(opts?.limit ?? 20);
    return (data ?? []).map((r) => ({
      id: String(r.id),
      reminderType: String(r.reminder_type),
      channel: String(r.channel),
      recipient: (r.recipient as string | null) ?? null,
      createdAt: String(r.created_at),
    }));
  } catch {
    return [];
  }
}
