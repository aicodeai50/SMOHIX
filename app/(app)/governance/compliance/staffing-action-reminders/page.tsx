import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildStaffingOverdueRemindersPack,
  getStaffingOverdueReminderOrgSettings,
  listStaffingOverdueReminderLog,
} from "@/lib/compliance/staffing-action-overdue-reminders";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  runStaffingOverdueRemindersAction,
  updateStaffingOverdueReminderSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Staffing action overdue reminders",
  description:
    "Email and Slack nudges when accepted staffing actions remain open past the forecast peak week.",
};

export const dynamic = "force-dynamic";

export default async function StaffingActionRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    sent?: string;
    overdue?: string;
    emails?: string;
    slack?: string;
    saved?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Staffing action overdue reminders"
        description="Sign in to configure overdue staffing reminders."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/staffing-action-reminders");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildStaffingOverdueRemindersPack(user.id, { orgId: orgContext.orgId, supabase })
    : null;

  const settings = orgContext.orgId
    ? await getStaffingOverdueReminderOrgSettings(orgContext.orgId, supabase)
    : null;

  const reminderLog = orgContext.orgId
    ? await listStaffingOverdueReminderLog(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Staffing action overdue reminders"
        description="Nudge assignees and admins when accepted or in-progress staffing actions remain open after the forecast peak week ends."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />

      {typeof sp.sent === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>
          Reminders sent — {sp.overdue ?? "0"} overdue action(s), {sp.emails ?? "0"} email(s)
          {sp.slack === "1" ? ", Slack sent" : ""}.
        </p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Settings saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Overdue reminders unavailable"
          description="Join an organization with tracked staffing actions past peak week to send reminders."
          ctas={[
            { href: "/governance/compliance/staffing-actions", label: "Staffing actions" },
            { href: "/governance/compliance/peak-week-staffing-digest", label: "Staffing digest" },
          ]}
        />
      ) : (
        <>
          <div
            className={`mb-6 rounded-xl border px-4 py-3 ${pack.overdueItems.length > 0 ? "border-danger/40 bg-danger/10" : "border-emerald-500/30 bg-emerald-500/5"}`}
          >
            <p className={appOverline}>Overdue status</p>
            <p
              className={`mt-1 font-semibold ${pack.overdueItems.length > 0 ? "text-danger" : "text-emerald-300"} ${appBody}`}
            >
              {pack.overdueItems.length > 0
                ? `${pack.overdueItems.length} overdue action(s)`
                : "No overdue actions"}
            </p>
            <p className={`mt-2 ${appMeta} text-muted`}>{pack.committeeSummary}</p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Open actions</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.openActionCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.overdueItems.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Reminders</p>
              <p className={`mt-1 text-sm font-semibold text-foreground ${appBody}`}>
                {settings?.remindersEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/staffing-action-reminders?format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/staffing-action-reminders?format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          {canEdit ? (
            <ConsolePanel title="Reminder settings">
              <form
                action={updateStaffingOverdueReminderSettingsAction}
                className={`space-y-4 ${appBody}`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="reminders_enabled"
                    defaultChecked={settings?.remindersEnabled}
                    className="rounded border-border"
                  />
                  <span>Enable overdue staffing reminders</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="email_enabled"
                    defaultChecked={settings?.emailEnabled}
                    className="rounded border-border"
                  />
                  <span>Email assignees and admins for unassigned overdue actions</span>
                </label>
                <button
                  type="submit"
                  className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                >
                  Save settings
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={runStaffingOverdueRemindersAction}>
                  <button
                    type="submit"
                    disabled={pack.overdueItems.length === 0}
                    className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20 disabled:opacity-40"
                  >
                    Send reminders now
                  </button>
                </form>
                {pack.overdueItems.length > 0 ? (
                  <form action={runStaffingOverdueRemindersAction}>
                    <input type="hidden" name="force" value="1" />
                    <button
                      type="submit"
                      className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                    >
                      Force resend
                    </button>
                  </form>
                ) : null}
              </div>
              <p className={`mt-3 ${appMeta} text-muted`}>
                Slack:{" "}
                <code className="text-foreground/80">SMOHIX_SLACK_NOTIFY_STAFFING_OVERDUE</code>
                {" · "}
                Cron:{" "}
                <code className="text-foreground/80">SMOHIX_STAFFING_OVERDUE_REMINDER_CRON_SECRET</code>
              </p>
            </ConsolePanel>
          ) : null}

          {pack.overdueItems.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="Overdue actions">
                <ul className={`space-y-2 ${appMeta}`}>
                  {pack.overdueItems.map((item) => (
                    <li
                      key={item.action.id}
                      className="rounded-lg border border-white/[0.06] px-3 py-2"
                    >
                      <span className="font-medium text-foreground">{item.action.title}</span>
                      {" · "}
                      {item.action.status}
                      {" · peak "}
                      {item.action.peakWeekKey}
                      {" · +"}
                      {item.daysPastPeakWeek}d
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}

          {reminderLog.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="Reminder log">
                <ul className={`space-y-2 ${appMeta}`}>
                  {reminderLog.map((row) => (
                    <li key={row.id} className="rounded-lg border border-white/[0.06] px-3 py-2">
                      <span className="font-mono text-xs text-muted">
                        {row.createdAt.slice(0, 19)}
                      </span>
                      {" · "}
                      {row.channel}
                      {" · "}
                      <span className="font-mono text-xs">{row.reminderKey.slice(0, 48)}</span>
                      {row.recipient ? ` → ${row.recipient}` : ""}
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}

          <p className={`mt-6 ${appMeta}`}>
            <Link
              href="/governance/compliance/staffing-actions"
              className="text-accent hover:underline"
            >
              Staffing actions
            </Link>
            {" · "}
            <Link
              href="/governance/compliance/peak-week-staffing-digest"
              className="text-accent hover:underline"
            >
              Staffing digest
            </Link>
          </p>
        </>
      )}
    </>
  );
}
