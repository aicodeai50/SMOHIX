import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { startOfUtcWeek } from "@/lib/compliance/board-obligation-forecast";
import {
  buildObligationStaffingActionTrackerPack,
  type ObligationStaffingActionTrackerPack,
  type StaffingActionTrackerItem,
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

export const STAFFING_COMPLETION_ROLLUP_VERSION = "zentro-staffing-completion-rollup/1";

export type StaffingCompletionRollupOrgSettings = {
  rollupEnabled: boolean;
  emailEnabled: boolean;
};

export type StaffingCompletionRollupPack = {
  version: typeof STAFFING_COMPLETION_ROLLUP_VERSION;
  generatedAt: string;
  orgId: string | null;
  orgName: string;
  horizonDays: number;
  tracker: ObligationStaffingActionTrackerPack;
  trackedCount: number;
  completedCount: number;
  openCount: number;
  proposedCount: number;
  completionPercent: number;
  openItems: StaffingActionTrackerItem[];
  completedItems: StaffingActionTrackerItem[];
  committeeSummary: string;
  lastDeliveryAt: string | null;
};

export type StaffingCompletionRollupDeliveryRow = {
  id: string;
  periodKey: string;
  trackedCount: number;
  completedCount: number;
  openCount: number;
  completionPercent: number;
  emailsSent: number;
  deliveryStatus: string;
  createdAt: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function staffingCompletionPeriodKey(now = new Date()): string {
  return `week:${startOfUtcWeek(now.toISOString())}`;
}

export function buildStaffingCompletionRollupFromTracker(
  tracker: ObligationStaffingActionTrackerPack,
  orgName: string,
  lastDeliveryAt?: string | null,
): StaffingCompletionRollupPack {
  const trackedItems = tracker.items.filter((i) => i.tracked);
  const trackedCount = trackedItems.length;
  const completedCount = trackedItems.filter((i) => i.status === "completed").length;
  const openCount = trackedItems.filter((i) => i.isOpen).length;
  const proposedCount = tracker.stats.proposed;
  const completionPercent =
    trackedCount === 0 ? 0 : Math.round((completedCount / trackedCount) * 100);

  const openItems = trackedItems.filter((i) => i.isOpen);
  const completedItems = trackedItems.filter((i) => i.status === "completed");

  const committeeSummary =
    trackedCount === 0
      ? "No tracked staffing actions yet — accept load-balance or capacity relief proposals to build the archive."
      : openCount === 0
        ? `All ${trackedCount} tracked staffing action(s) are closed — ${completionPercent}% completion rate for committee archives.`
        : `${openCount} open and ${completedCount} completed of ${trackedCount} tracked action(s) — ${completionPercent}% completion.`;

  return {
    version: STAFFING_COMPLETION_ROLLUP_VERSION,
    generatedAt: tracker.generatedAt,
    orgId: tracker.orgId,
    orgName,
    horizonDays: tracker.horizonDays,
    tracker,
    trackedCount,
    completedCount,
    openCount,
    proposedCount,
    completionPercent,
    openItems,
    completedItems,
    committeeSummary,
    lastDeliveryAt: lastDeliveryAt ?? null,
  };
}

export async function getStaffingCompletionRollupOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<StaffingCompletionRollupOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_staffing_completion_rollup_enabled, compliance_staffing_completion_rollup_email_enabled",
    )
    .eq("id", orgId)
    .maybeSingle();

  return {
    rollupEnabled: data?.compliance_staffing_completion_rollup_enabled !== false,
    emailEnabled: data?.compliance_staffing_completion_rollup_email_enabled !== false,
  };
}

export async function updateStaffingCompletionRollupOrgSettings(
  orgId: string,
  input: Partial<StaffingCompletionRollupOrgSettings>,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {};
  if (input.rollupEnabled !== undefined) {
    patch.compliance_staffing_completion_rollup_enabled = input.rollupEnabled;
  }
  if (input.emailEnabled !== undefined) {
    patch.compliance_staffing_completion_rollup_email_enabled = input.emailEnabled;
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  return !error;
}

export async function getLastStaffingCompletionRollupDeliveryAt(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<string | null> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_staffing_completion_rollup_deliveries")
    .select("created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.created_at ? String(data.created_at) : null;
}

export async function listStaffingCompletionRollupDeliveries(
  orgId: string,
  opts?: { supabase?: SupabaseClient; limit?: number },
): Promise<StaffingCompletionRollupDeliveryRow[]> {
  const client = opts?.supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_staffing_completion_rollup_deliveries")
    .select(
      "id, period_key, tracked_count, completed_count, open_count, completion_percent, emails_sent, delivery_status, created_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 10);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    periodKey: String(row.period_key),
    trackedCount: Number(row.tracked_count) || 0,
    completedCount: Number(row.completed_count) || 0,
    openCount: Number(row.open_count) || 0,
    completionPercent: Number(row.completion_percent) || 0,
    emailsSent: Number(row.emails_sent) || 0,
    deliveryStatus: String(row.delivery_status),
    createdAt: String(row.created_at),
  }));
}

export async function wasStaffingCompletionRollupDelivered(
  orgId: string,
  periodKey: string,
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("compliance_staffing_completion_rollup_deliveries")
    .select("id")
    .eq("org_id", orgId)
    .eq("period_key", periodKey)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function buildStaffingCompletionRollupPack(
  userId: string,
  opts: {
    orgId: string | null;
    orgName?: string;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<StaffingCompletionRollupPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const tracker = await buildObligationStaffingActionTrackerPack(userId, {
    orgId: opts.orgId,
    horizonDays: opts.horizonDays,
    supabase,
  });
  if (!tracker) return null;

  let orgName = opts.orgName ?? "Organization";
  if (!opts.orgName) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", opts.orgId)
      .maybeSingle();
    if (orgRow?.name) orgName = String(orgRow.name);
  }

  const lastDeliveryAt = await getLastStaffingCompletionRollupDeliveryAt(opts.orgId, supabase);
  return buildStaffingCompletionRollupFromTracker(tracker, orgName, lastDeliveryAt);
}

function renderItemRows(items: StaffingActionTrackerItem[]): string {
  if (items.length === 0) {
    return `<tr><td colspan="5" class="muted">None</td></tr>`;
  }
  return items
    .map(
      (item) =>
        `<tr>
          <td>${escapeHtml(item.status)}</td>
          <td>${escapeHtml(item.proposal.actionType)}</td>
          <td>${escapeHtml(item.proposal.title)}</td>
          <td>${escapeHtml(item.proposal.peakWeekKey ?? "—")}</td>
          <td>${escapeHtml(item.proposal.fromOwnerLabel ?? "—")} → ${escapeHtml(item.proposal.toOwnerLabel ?? "—")}</td>
        </tr>`,
    )
    .join("");
}

export function buildStaffingCompletionRollupHtml(pack: StaffingCompletionRollupPack): string {
  const stamp = pack.generatedAt.slice(0, 10);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Staffing completion rollup — ${escapeHtml(pack.orgName)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 960px; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #555; margin-bottom: 1.5rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; margin: 1rem 0 1.5rem; }
    .stat { border: 1px solid #ddd; border-radius: 8px; padding: 0.75rem; }
    .stat strong { display: block; font-size: 1.25rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 0.9rem; }
    th { background: #f4f4f4; }
    .muted { color: #666; }
    @media print {
      body { padding: 0.5in; }
      a { color: #000; text-decoration: none; }
    }
  </style>
</head>
<body>
  <h1>Staffing action completion rollup</h1>
  <p class="meta">${escapeHtml(pack.orgName)} · ${stamp} · horizon ${pack.horizonDays}d · ${escapeHtml(SITE_BRAND_NAME)}</p>
  <p>${escapeHtml(pack.committeeSummary)}</p>
  <div class="stats">
    <div class="stat"><span class="muted">Tracked</span><strong>${pack.trackedCount}</strong></div>
    <div class="stat"><span class="muted">Completed</span><strong>${pack.completedCount}</strong></div>
    <div class="stat"><span class="muted">Open</span><strong>${pack.openCount}</strong></div>
    <div class="stat"><span class="muted">Proposed</span><strong>${pack.proposedCount}</strong></div>
    <div class="stat"><span class="muted">Completion</span><strong>${pack.completionPercent}%</strong></div>
  </div>
  <h2>Open actions</h2>
  <table>
    <thead><tr><th>Status</th><th>Type</th><th>Title</th><th>Peak week</th><th>Owners</th></tr></thead>
    <tbody>${renderItemRows(pack.openItems)}</tbody>
  </table>
  <h2>Completed actions</h2>
  <table>
    <thead><tr><th>Status</th><th>Type</th><th>Title</th><th>Peak week</th><th>Owners</th></tr></thead>
    <tbody>${renderItemRows(pack.completedItems)}</tbody>
  </table>
  <p class="muted">Print this page (Ctrl+P / Cmd+P) and choose Save as PDF for committee archives.</p>
</body>
</html>`;
}

export function staffingCompletionRollupToCsv(pack: StaffingCompletionRollupPack): string {
  const lines = [
    "section,status,action_type,title,peak_week_key,from_owner,to_owner",
    ...pack.openItems.map((item) =>
      [
        "open",
        item.status,
        item.proposal.actionType,
        JSON.stringify(item.proposal.title),
        item.proposal.peakWeekKey ?? "",
        JSON.stringify(item.proposal.fromOwnerLabel ?? ""),
        JSON.stringify(item.proposal.toOwnerLabel ?? ""),
      ].join(","),
    ),
    ...pack.completedItems.map((item) =>
      [
        "completed",
        item.status,
        item.proposal.actionType,
        JSON.stringify(item.proposal.title),
        item.proposal.peakWeekKey ?? "",
        JSON.stringify(item.proposal.fromOwnerLabel ?? ""),
        JSON.stringify(item.proposal.toOwnerLabel ?? ""),
      ].join(","),
    ),
    [
      "summary",
      "",
      "",
      JSON.stringify(pack.committeeSummary),
      String(pack.completionPercent),
      String(pack.trackedCount),
      String(pack.openCount),
    ].join(","),
  ];
  return `${lines.join("\n")}\n`;
}

export type DeliverStaffingCompletionRollupResult =
  | { ok: true; pack: StaffingCompletionRollupPack; emailsSent: number }
  | { ok: false; reason: string };

export async function deliverStaffingCompletionRollup(
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
): Promise<DeliverStaffingCompletionRollupResult> {
  if (!hasSupabaseAuth() || !actorUserId || !orgId) {
    return { ok: false, reason: "Not configured." };
  }

  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const settings = await getStaffingCompletionRollupOrgSettings(orgId, supabase);
  if (!settings.rollupEnabled) {
    return { ok: false, reason: "Staffing completion rollup disabled for org." };
  }

  const pack = await buildStaffingCompletionRollupPack(actorUserId, {
    orgId,
    orgName: opts.orgName,
    horizonDays: opts.horizonDays,
    supabase,
  });
  if (!pack) return { ok: false, reason: "Could not build completion rollup." };

  if (pack.trackedCount === 0) {
    return { ok: false, reason: "No tracked staffing actions — rollup not sent." };
  }

  const periodKey = staffingCompletionPeriodKey();
  if (!opts.force && (await wasStaffingCompletionRollupDelivered(orgId, periodKey, supabase))) {
    return { ok: false, reason: "Completion rollup already delivered this week." };
  }

  const origin = opts.siteOrigin.replace(/\/$/, "");
  let emailsSent = 0;

  if (settings.emailEnabled && isTransactionalEmailConfigured()) {
    const members = await listOrgMembers(orgId, { supabase });
    const recipients = members.filter(
      (m) => MEMBER_ADMIN_ROLES.includes(m.role) && m.email?.trim(),
    );

    const htmlUrl = `${origin}/api/governance/compliance/staffing-completion-rollup?horizonDays=${pack.horizonDays}&format=html`;
    const text = [
      `${SITE_BRAND_NAME} staffing completion rollup for ${pack.orgName}:`,
      "",
      pack.committeeSummary,
      "",
      `Tracked: ${pack.trackedCount} · Completed: ${pack.completedCount} · Open: ${pack.openCount} · ${pack.completionPercent}% complete`,
      "",
      `Printable HTML (Save as PDF): ${htmlUrl}`,
      `Console: ${origin}/governance/compliance/staffing-completion-rollup`,
    ].join("\n");

    for (const admin of recipients) {
      const sent = await sendTransactionalEmailWithAudit({
        to: admin.email!.trim(),
        subject: `[Zentro] Staffing completion rollup — ${pack.orgName} (${pack.completionPercent}%)`,
        text,
        userId: actorUserId,
        orgId,
        auditDetails: {
          event: "governance.staffing_completion_rollup_emailed",
          completion_percent: pack.completionPercent,
          tracked_count: pack.trackedCount,
        },
      });
      if (sent.ok) emailsSent += 1;
    }
  }

  if (emailsSent === 0 && settings.emailEnabled) {
    return { ok: false, reason: "No admin emails sent (check Resend configuration)." };
  }

  await supabase.from("compliance_staffing_completion_rollup_deliveries").insert({
    org_id: orgId,
    period_key: periodKey,
    tracked_count: pack.trackedCount,
    completed_count: pack.completedCount,
    open_count: pack.openCount,
    completion_percent: pack.completionPercent,
    emails_sent: emailsSent,
    delivery_status: "sent",
    delivery_note: opts.scheduled ? "scheduled" : "manual",
  });

  await appendAuditEvent({
    event_type: "governance.staffing_completion_rollup_delivered",
    user_id: actorUserId,
    org_id: orgId,
    details: {
      period_key: periodKey,
      tracked_count: pack.trackedCount,
      completed_count: pack.completedCount,
      open_count: pack.openCount,
      completion_percent: pack.completionPercent,
      emails_sent: emailsSent,
      scheduled: Boolean(opts.scheduled),
    },
  });

  return { ok: true, pack, emailsSent };
}
