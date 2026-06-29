import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  collectComplianceSlaReminders,
  getComplianceSlaOrgSettings,
  listComplianceSlaReminderLog,
} from "@/lib/compliance/compliance-sla-reminders";
import { isSlackWebhookConfigured } from "@/lib/integrations/slack";
import { isTransactionalEmailConfigured } from "@/lib/notifications/email";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { runSlaRemindersAction, updateSlaReminderSettingsAction } from "./actions";

export const metadata: Metadata = {
  title: "Compliance SLA reminders",
  description: "Email and Slack nudges for approaching attestation due dates and control readiness regression.",
};

export const dynamic = "force-dynamic";

export default async function ComplianceSlaRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    sent?: string;
    saved?: string;
    slack?: string;
    emails?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Compliance SLA reminders"
          description="Sign in to configure attestation and readiness SLA notifications."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/sla-reminders");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const settings = orgContext.orgId
    ? await getComplianceSlaOrgSettings(orgContext.orgId, supabase)
    : null;
  const bundle = orgContext.orgId
    ? await collectComplianceSlaReminders(user.id, orgContext.orgId, {
        dueDaysBefore: settings?.dueDaysBefore ?? 7,
        supabase,
      })
    : null;
  const log = orgContext.orgId
    ? await listComplianceSlaReminderLog(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;
  const slackConfigured = isSlackWebhookConfigured();
  const emailConfigured = isTransactionalEmailConfigured();

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance SLA reminders"
        description="Slack and email nudges when control attestations approach due dates, become overdue, or SOC 2 / ISO readiness regresses in the 30-day monitoring window."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance/attestations" className="text-accent hover:underline">
          Attestations
        </Link>
        {" · "}
        <Link href="/governance/compliance/program" className="text-accent hover:underline">
          Program dashboard
        </Link>
        {" · "}
        <Link href="/governance/compliance/digest" className="text-accent hover:underline">
          Compliance digest
        </Link>
      </p>

      {sp.sent === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          Reminders processed. Slack: {sp.slack === "1" ? "sent" : "skipped"} · Emails sent: {sp.emails ?? "0"}
        </p>
      ) : null}
      {sp.saved === "1" ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-200 ${appBody}`}>
          SLA reminder settings saved.
        </p>
      ) : null}
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err === "rbac"
            ? "Only org owners and admins can manage SLA reminders."
            : err}
        </p>
      ) : null}

      {!orgContext.orgId ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Create an organization to enable compliance SLA reminders."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Due soon</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {bundle?.dueSoon.length ?? 0}
              </p>
              <p className={`${appMeta} text-muted`}>Within {settings?.dueDaysBefore ?? 7} days</p>
            </div>
            <div className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-warning ${appBody}`}>
                {bundle?.overdue.length ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Regressed</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {bundle?.regressed.length ?? 0}
              </p>
              <p className={`${appMeta} text-muted`}>SOC 2 / ISO 30d window</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ConsolePanel title={canEdit ? "Send reminders" : "Preview"}>
              {canEdit ? (
                <form action={runSlaRemindersAction} className="space-y-3">
                  <p className={`${appMeta} text-muted`}>
                    Delivers one Slack summary (if configured) and owner/admin emails via Resend. Each item is
                    deduped per calendar week.
                  </p>
                  <button
                    type="submit"
                    className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
                  >
                    Send SLA reminders now
                  </button>
                </form>
              ) : (
                <p className={`${appMeta} text-muted`}>Owners and admins can trigger delivery.</p>
              )}
            </ConsolePanel>

            <ConsolePanel title="Org settings">
              {canEdit && settings ? (
                <form action={updateSlaReminderSettingsAction} className="space-y-3">
                  <label className={`flex items-center gap-2 ${appBody}`}>
                    <input
                      type="checkbox"
                      name="compliance_sla_reminders_enabled"
                      defaultChecked={settings.enabled}
                      className="rounded border-border"
                    />
                    Enable SLA reminders
                  </label>
                  <label className={`flex items-center gap-2 ${appBody}`}>
                    <input
                      type="checkbox"
                      name="compliance_sla_email_enabled"
                      defaultChecked={settings.emailEnabled}
                      className="rounded border-border"
                    />
                    Send email to owners / assignees
                  </label>
                  <div>
                    <label className={appLabel} htmlFor="compliance_sla_due_days_before">
                      Due-date warning (days)
                    </label>
                    <input
                      id="compliance_sla_due_days_before"
                      name="compliance_sla_due_days_before"
                      type="number"
                      min={1}
                      max={30}
                      defaultValue={settings.dueDaysBefore}
                      className={`mt-1 h-10 w-24 rounded-lg border border-border bg-background px-3 ${appBody}`}
                    />
                  </div>
                  <button
                    type="submit"
                    className={`h-10 rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent ${appBody}`}
                  >
                    Save settings
                  </button>
                </form>
              ) : (
                <p className={`${appMeta} text-muted`}>
                  {settings?.enabled ? "Reminders enabled" : "Reminders disabled"} · warning{" "}
                  {settings?.dueDaysBefore ?? 7}d
                </p>
              )}
            </ConsolePanel>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Slack</p>
              <p className={`mt-1 ${appBody}`}>{slackConfigured ? "Webhook configured" : "Not configured"}</p>
              <p className={`${appMeta} text-muted`}>ZENTRO_SLACK_WEBHOOK_URL · ZENTRO_SLACK_NOTIFY_COMPLIANCE_SLA</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Email (Resend)</p>
              <p className={`mt-1 ${appBody}`}>{emailConfigured ? "Resend configured" : "Not configured"}</p>
              <p className={`${appMeta} text-muted`}>ZENTRO_RESEND_API_KEY · ZENTRO_EMAIL_FROM</p>
            </div>
          </div>
        </>
      )}

      <div className="mt-6">
        <ConsolePanel title="Delivery log">
          {log.length === 0 ? (
            <p className={`${appMeta} text-muted`}>No reminders sent yet this org.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-left ${appBody}`}>
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Channel</th>
                    <th className="px-3 py-2">Recipient</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border ${appMeta}`}>
                  {log.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-3 text-muted">{new Date(row.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-3 capitalize">{row.reminderType.replace(/_/g, " ")}</td>
                      <td className="px-3 py-3">{row.channel}</td>
                      <td className="px-3 py-3 font-mono text-[10px] text-muted">{row.recipient ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ConsolePanel>
      </div>
    </>
  );
}
