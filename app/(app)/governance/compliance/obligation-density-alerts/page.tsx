import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildObligationDensityAlertingPack,
  listObligationDensityAlertLog,
} from "@/lib/compliance/obligation-density-alerting";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  runObligationDensityAlertsAction,
  updateObligationDensityAlertSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Obligation density alerts",
  description: "Slack and email when weekly obligation density exceeds org thresholds.",
};

export const dynamic = "force-dynamic";

export default async function ObligationDensityAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    sent?: string;
    saved?: string;
    slack?: string;
    emails?: string;
    breaches?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Obligation density alerts"
        description="Sign in to configure obligation density alerting thresholds."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-density-alerts");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildObligationDensityAlertingPack(user.id, { orgId: orgContext.orgId, supabase })
    : null;

  const log = orgContext.orgId
    ? await listObligationDensityAlertLog(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Obligation density alerting"
        description="Configurable thresholds on live forecast density — Slack and email owners/admins when the current week, peak week, or overdue counts exceed limits."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />

      {typeof sp.sent === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>
          Alerts sent — {sp.breaches ?? "0"} breach(es), {sp.emails ?? "0"} email(s)
          {sp.slack === "1" ? ", Slack notified" : ""}.
        </p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Threshold settings saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with compliance obligations to configure density alerts."
          ctas={[{ href: "/governance/compliance/obligation-forecast", label: "Forecast" }]}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Current week</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.currentWeekCount}
                <span className={`ml-2 text-base font-normal ${appMeta}`}>
                  / {pack.settings.weeklyThreshold}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Peak week</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.forecast?.peakWeekCount ?? 0}
                <span className={`ml-2 text-base font-normal ${appMeta}`}>
                  / {pack.settings.peakThreshold}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {pack.forecast?.currentOverdue ?? 0}
                <span className={`ml-2 text-base font-normal ${appMeta}`}>
                  / {pack.settings.overdueThreshold || "off"}
                </span>
              </p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${pack.anyBreach ? "border-danger/40 bg-danger/10" : "border-emerald-500/30 bg-emerald-500/5"}`}
            >
              <p className={appOverline}>Status</p>
              <p
                className={`mt-1 text-lg font-semibold ${pack.anyBreach ? "text-danger" : "text-emerald-300"} ${appBody}`}
              >
                {pack.anyBreach ? `${pack.breaches.length} breach(es)` : "Within limits"}
              </p>
            </div>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>
            Slack: {pack.slackConfigured ? "configured" : "not configured"} · Email:{" "}
            {pack.emailConfigured ? "configured" : "not configured"} · Env:{" "}
            <code className="text-foreground/80">ZENTRO_SLACK_NOTIFY_OBLIGATION_DENSITY</code>
          </p>

          {canEdit ? (
            <PlaceholderCard title="Threshold settings">
              <form action={updateObligationDensityAlertSettingsAction} className={`space-y-4 ${appBody}`}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="alerts_enabled"
                    defaultChecked={pack.settings.enabled}
                    className="rounded border-border"
                  />
                  <span>Enable density alerts</span>
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={appLabel} htmlFor="weekly_threshold">
                      Current week threshold
                    </label>
                    <input
                      id="weekly_threshold"
                      name="weekly_threshold"
                      type="number"
                      min={1}
                      max={50}
                      defaultValue={pack.settings.weeklyThreshold}
                      className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className={appLabel} htmlFor="peak_threshold">
                      Peak week threshold
                    </label>
                    <input
                      id="peak_threshold"
                      name="peak_threshold"
                      type="number"
                      min={1}
                      max={50}
                      defaultValue={pack.settings.peakThreshold}
                      className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className={appLabel} htmlFor="overdue_threshold">
                      Overdue threshold (0=off)
                    </label>
                    <input
                      id="overdue_threshold"
                      name="overdue_threshold"
                      type="number"
                      min={0}
                      max={30}
                      defaultValue={pack.settings.overdueThreshold}
                      className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="email_enabled"
                    defaultChecked={pack.settings.emailEnabled}
                    className="rounded border-border"
                  />
                  <span>Email owners and admins</span>
                </label>
                <button
                  type="submit"
                  className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                >
                  Save thresholds
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={runObligationDensityAlertsAction}>
                  <button
                    type="submit"
                    className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20"
                  >
                    Send alerts now
                  </button>
                </form>
                {pack.anyBreach ? (
                  <form action={runObligationDensityAlertsAction}>
                    <input type="hidden" name="force" value="1" />
                    <button
                      type="submit"
                      className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
                    >
                      Force resend
                    </button>
                  </form>
                ) : null}
              </div>
            </PlaceholderCard>
          ) : null}

          {pack.breaches.length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Active breaches">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.breaches.map((b) => (
                    <li key={b.alertKey} className="rounded-lg border border-danger/25 px-3 py-2">
                      <p className="font-medium text-danger">{b.label}</p>
                      <p className={`${appMeta} text-muted`}>{b.detail}</p>
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}

          {log.length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Alert delivery log">
                <ul className={`space-y-2 ${appMeta}`}>
                  {log.map((row) => (
                    <li key={row.id} className="rounded-lg border border-white/[0.06] px-3 py-2">
                      <span className="font-mono text-xs text-muted">{row.createdAt.slice(0, 19)}</span>
                      {" · "}
                      {row.alertType} · {row.channel} · {row.metricValue}/{row.thresholdValue}
                      {row.recipient ? <span className="block text-muted">{row.recipient}</span> : null}
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}

          <p className={`mt-6 ${appMeta}`}>
            <Link href="/governance/compliance/obligation-forecast" className="text-accent hover:underline">
              Forecast timeline
            </Link>
            {" · "}
            <Link href="/governance/compliance/sla-reminders" className="text-accent hover:underline">
              SLA reminders
            </Link>
          </p>
        </>
      )}
    </>
  );
}
