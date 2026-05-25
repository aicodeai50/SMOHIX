import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  isSlackWebhookConfigured,
  sendSlackNotificationWithAudit,
} from "@/lib/integrations/slack";
import {
  listStaffingActions,
  type StaffingActionRow,
  type StaffingActionStatus,
} from "@/lib/compliance/obligation-staffing-action-tracker";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmailWithAudit,
} from "@/lib/notifications/email";
import { listOrgMembers } from "@/lib/org/data";
import { MEMBER_ADMIN_ROLES } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const STAFFING_ACTION_OVERDUE_REMINDERS_VERSION =
  "zentro-staffing-action-overdue-reminders/1";

const OPEN_STATUSES: StaffingActionStatus[] = ["accepted", "in_progress"];

export type StaffingOverdueReminderOrgSettings = {
  remindersEnabled: boolean;
  emailEnabled: boolean;
};

export type OverdueStaffingActionItem = {
  action: StaffingActionRow;
  peakWeekEnd: string;
  daysPastPeakWeek: number;
};

export type StaffingOverdueRemindersPack = {
  version: typeof STAFFING_ACTION_OVERDUE_REMINDERS_VERSION;
  generatedAt: string;
  orgId: string | null;
  settings: StaffingOverdueReminderOrgSettings;
  overdueItems: OverdueStaffingActionItem[];
  openActionCount: number;
  committeeSummary: string;
};

export function endOfUtcWeekIso(weekKey: string): string {
  const d = new Date(`${weekKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString();
}

export function isStaffingActionOverdue(
  action: StaffingActionRow,
  now = new Date(),
): boolean {
  if (!action.peakWeekKey) return false;
  if (!OPEN_STATUSES.includes(action.status)) return false;
  const endMs = new Date(endOfUtcWeekIso(action.peakWeekKey)).getTime();
  return now.getTime() > endMs;
}

export function daysPastPeakWeek(peakWeekKey: string, now = new Date()): number {
  const endMs = new Date(endOfUtcWeekIso(peakWeekKey)).getTime();
  if (now.getTime() <= endMs) return 0;
  return Math.floor((now.getTime() - endMs) / 86_400_000);
}

export function collectOverdueStaffingActions(
  actions: StaffingActionRow[],
  now = new Date(),
): OverdueStaffingActionItem[] {
  return actions
    .filter((a) => isStaffingActionOverdue(a, now))
    .map((action) => ({
      action,
      peakWeekEnd: endOfUtcWeekIso(action.peakWeekKey!),
      daysPastPeakWeek: daysPastPeakWeek(action.peakWeekKey!, now),
    }))
    .sort((a, b) => b.daysPastPeakWeek - a.daysPastPeakWeek);
}

export function staffingOverdueReminderKey(actionId: string, peakWeekKey: string): string {
  return `staffing_overdue:${actionId}:${peakWeekKey}`;
}

export function buildStaffingOverdueRemindersFromParts(input: {
  orgId: string | null;
  settings: StaffingOverdueReminderOrgSettings;
  actions: StaffingActionRow[];
  now?: Date;
  generatedAt?: string;
}): StaffingOverdueRemindersPack {
  const now = input.now ?? new Date();
  const overdueItems = collectOverdueStaffingActions(input.actions, now);
  const openActionCount = input.actions.filter((a) => OPEN_STATUSES.includes(a.status)).length;

  const committeeSummary =
    overdueItems.length === 0
      ? openActionCount === 0
        ? "No open staffing actions — overdue reminders not required."
        : `${openActionCount} open action(s) are still within the peak week window.`
      : `${overdueItems.length} staffing action(s) remain open past peak week — send reminders to assignees and admins.`;

  return {
    version: STAFFING_ACTION_OVERDUE_REMINDERS_VERSION,
    generatedAt: input.generatedAt ?? now.toISOString(),
    orgId: input.orgId,
    settings: input.settings,
    overdueItems,
    openActionCount,
    committeeSummary,
  };
}

export async function getStaffingOverdueReminderOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<StaffingOverdueReminderOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_staffing_overdue_reminders_enabled, compliance_staffing_overdue_email_enabled",
    )
    .eq("id", orgId)
    .maybeSingle();

  return {
    remindersEnabled: data?.compliance_staffing_overdue_reminders_enabled !== false,
    emailEnabled: data?.compliance_staffing_overdue_email_enabled !== false,
  };
}

export async function updateStaffingOverdueReminderOrgSettings(
  orgId: string,
  input: Partial<StaffingOverdueReminderOrgSettings>,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {};
  if (input.remindersEnabled !== undefined) {
    patch.compliance_staffing_overdue_reminders_enabled = input.remindersEnabled;
  }
  if (input.emailEnabled !== undefined) {
    patch.compliance_staffing_overdue_email_enabled = input.emailEnabled;
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  return !error;
}

async function wasStaffingReminderSent(
  orgId: string,
  reminderKey: string,
  channel: "slack" | "email",
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_staffing_action_reminder_log")
    .select("id")
    .eq("org_id", orgId)
    .eq("reminder_key", reminderKey)
    .eq("channel", channel)
    .maybeSingle();
  return Boolean(data?.id);
}

async function logStaffingReminderSent(
  orgId: string,
  input: {
    actionId: string;
    reminderKey: string;
    channel: "slack" | "email";
    recipient: string | null;
  },
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.from("compliance_staffing_action_reminder_log").insert({
    org_id: orgId,
    action_id: input.actionId,
    reminder_key: input.reminderKey,
    channel: input.channel,
    recipient: input.recipient,
  });
}

function buildAssigneeOverdueEmail(input: {
  orgName: string;
  recipientName: string;
  items: OverdueStaffingActionItem[];
  siteOrigin: string;
}): { subject: string; text: string } {
  const lines = [
    `Hi ${input.recipientName},`,
    "",
    `${SITE_BRAND_NAME} staffing actions still open past the forecast peak week for ${input.orgName}:`,
    "",
  ];
  for (const item of input.items.slice(0, 15)) {
    lines.push(
      `- [${item.action.status}] ${item.action.title} (peak week ended ${item.peakWeekEnd.slice(0, 10)}, +${item.daysPastPeakWeek}d)`,
    );
    if (item.action.toOwnerLabel) {
      lines.push(`  Assignee path: ${item.action.toOwnerLabel}`);
    }
  }
  if (input.items.length > 15) {
    lines.push(`… and ${input.items.length - 15} more action(s).`);
  }
  const origin = input.siteOrigin.replace(/\/$/, "");
  lines.push(
    "",
    `Staffing tracker: ${origin}/governance/compliance/staffing-actions`,
    `Load balancing: ${origin}/governance/compliance/obligation-load-balancing`,
  );
  return {
    subject: `[Zentro] Overdue staffing actions — ${input.orgName}`,
    text: lines.join("\n"),
  };
}

export async function buildStaffingOverdueRemindersPack(
  userId: string,
  opts: { orgId: string | null; supabase?: SupabaseClient },
): Promise<StaffingOverdueRemindersPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const [actions, settings] = await Promise.all([
    listStaffingActions(opts.orgId, supabase),
    getStaffingOverdueReminderOrgSettings(opts.orgId, supabase),
  ]);

  return buildStaffingOverdueRemindersFromParts({
    orgId: opts.orgId,
    settings,
    actions,
  });
}

export type RunStaffingOverdueRemindersResult =
  | {
      ok: true;
      pack: StaffingOverdueRemindersPack;
      slackSent: boolean;
      emailsSent: number;
      actionsNotified: number;
    }
  | { ok: false; reason: string };

export async function runStaffingOverdueRemindersForOrg(
  actorUserId: string,
  orgId: string,
  opts: {
    siteOrigin: string;
    orgName?: string;
    supabase?: SupabaseClient;
    force?: boolean;
    scheduled?: boolean;
  },
): Promise<RunStaffingOverdueRemindersResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getStaffingOverdueReminderOrgSettings(orgId, supabase);
  if (!settings.remindersEnabled) {
    return { ok: false, reason: "Staffing overdue reminders disabled for org." };
  }

  const pack = await buildStaffingOverdueRemindersPack(actorUserId, { orgId, supabase });
  if (!pack) return { ok: false, reason: "Could not build overdue pack." };

  if (pack.overdueItems.length === 0) {
    return { ok: false, reason: pack.committeeSummary };
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();
  const orgName = opts.orgName ?? String(orgRow?.name ?? "Organization");
  const origin = opts.siteOrigin.replace(/\/$/, "");

  let slackSent = false;
  let emailsSent = 0;
  let actionsNotified = 0;

  const slackKey = `staffing_overdue_slack:${pack.overdueItems.map((i) => i.action.id).join("|")}`;
  const slackAlready = opts.force
    ? false
    : await wasStaffingReminderSent(orgId, slackKey, "slack", supabase);

  if (!slackAlready && isSlackWebhookConfigured()) {
    const lines = pack.overdueItems.map(
      (i) =>
        `• ${i.action.title} (${i.action.status}, +${i.daysPastPeakWeek}d past peak ${i.action.peakWeekKey})`,
    );
    const result = await sendSlackNotificationWithAudit({
      userId: actorUserId,
      title: `Overdue staffing actions — ${orgName}`,
      body: lines.join("\n"),
      details: [
        `<${origin}/governance/compliance/staffing-actions|Staffing tracker>`,
        `<${origin}/governance/compliance/staffing-action-reminders|Overdue reminders>`,
      ],
      kind: "staffing_overdue",
      auditDetails: { org_id: orgId, overdue_count: pack.overdueItems.length },
    });
    if (result.ok) {
      slackSent = true;
      await logStaffingReminderSent(
        orgId,
        {
          actionId: pack.overdueItems[0]!.action.id,
          reminderKey: slackKey,
          channel: "slack",
          recipient: null,
        },
        supabase,
      );
    }
  }

  if (settings.emailEnabled && isTransactionalEmailConfigured()) {
    const members = await listOrgMembers(orgId, { supabase });
    const memberById = new Map(members.map((m) => [m.userId, m]));

    const byAssignee = new Map<string, OverdueStaffingActionItem[]>();
    for (const item of pack.overdueItems) {
      const uid = item.action.assigneeUserId;
      if (uid) {
        const list = byAssignee.get(uid) ?? [];
        list.push(item);
        byAssignee.set(uid, list);
      }
    }

    for (const [assigneeId, items] of byAssignee) {
      const member = memberById.get(assigneeId);
      const email = member?.email?.trim();
      if (!email) continue;

      const peakKey = items[0]!.action.peakWeekKey ?? "none";
      const key = staffingOverdueReminderKey(items[0]!.action.id, peakKey);
      if (!opts.force && (await wasStaffingReminderSent(orgId, key, "email", supabase))) {
        continue;
      }

      const mail = buildAssigneeOverdueEmail({
        orgName,
        recipientName: member?.displayName ?? member?.email ?? "there",
        items,
        siteOrigin: origin,
      });

      const sent = await sendTransactionalEmailWithAudit({
        to: email,
        subject: mail.subject,
        text: mail.text,
        userId: actorUserId,
        orgId,
        auditDetails: {
          event: "governance.staffing_action_overdue_emailed",
          assignee_user_id: assigneeId,
          overdue_count: items.length,
        },
      });

      if (sent.ok) {
        emailsSent += 1;
        actionsNotified += items.length;
        for (const item of items) {
          const rk = staffingOverdueReminderKey(
            item.action.id,
            item.action.peakWeekKey ?? peakKey,
          );
          await logStaffingReminderSent(
            orgId,
            { actionId: item.action.id, reminderKey: rk, channel: "email", recipient: email },
            supabase,
          );
        }
      }
    }

    const unassigned = pack.overdueItems.filter((i) => !i.action.assigneeUserId);
    if (unassigned.length > 0) {
      const admins = members.filter(
        (m) => MEMBER_ADMIN_ROLES.includes(m.role) && m.email?.trim(),
      );
      for (const admin of admins) {
        const mail = buildAssigneeOverdueEmail({
          orgName,
          recipientName: admin.displayName ?? admin.email ?? "there",
          items: unassigned,
          siteOrigin: origin,
        });
        const sent = await sendTransactionalEmailWithAudit({
          to: admin.email!.trim(),
          subject: mail.subject,
          text: mail.text,
          userId: actorUserId,
          orgId,
          auditDetails: {
            event: "governance.staffing_action_overdue_emailed",
            recipient_role: admin.role,
            unassigned_overdue: unassigned.length,
          },
        });
        if (sent.ok) emailsSent += 1;
      }
    }
  }

  if (slackSent || emailsSent > 0) {
    actionsNotified = pack.overdueItems.length;
  }

  await appendAuditEvent({
    event_type: "governance.staffing_action_overdue_reminders_sent",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      overdue_count: pack.overdueItems.length,
      slack_sent: slackSent,
      emails_sent: emailsSent,
      scheduled: Boolean(opts.scheduled),
    },
  });

  return {
    ok: true,
    pack,
    slackSent,
    emailsSent,
    actionsNotified,
  };
}

export type StaffingOverdueReminderLogRow = {
  id: string;
  actionId: string;
  reminderKey: string;
  channel: "slack" | "email";
  recipient: string | null;
  createdAt: string;
};

export async function listStaffingOverdueReminderLog(
  orgId: string,
  opts?: { supabase?: SupabaseClient; limit?: number },
): Promise<StaffingOverdueReminderLogRow[]> {
  const supabase = opts?.supabase ?? (await createServerSupabaseClient());
  const { data } = await supabase
    .from("compliance_staffing_action_reminder_log")
    .select("id, action_id, reminder_key, channel, recipient, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 25);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    actionId: String(row.action_id),
    reminderKey: String(row.reminder_key),
    channel: row.channel as "slack" | "email",
    recipient: row.recipient ? String(row.recipient) : null,
    createdAt: String(row.created_at),
  }));
}

export function staffingOverdueRemindersToCsv(pack: StaffingOverdueRemindersPack): string {
  const lines = [
    "action_id,title,status,peak_week_key,days_past_peak_week",
    ...pack.overdueItems.map((i) =>
      [
        i.action.id,
        JSON.stringify(i.action.title),
        i.action.status,
        i.action.peakWeekKey ?? "",
        i.daysPastPeakWeek,
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
