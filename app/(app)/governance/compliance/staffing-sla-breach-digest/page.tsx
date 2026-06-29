import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildStaffingSlaBreachDigestPack,
  DEFAULT_STAFFING_SLA_DAYS_AFTER_PEAK_WEEK,
  getStaffingSlaBreachDigestOrgSettings,
  listStaffingSlaBreachDigestDeliveries,
} from "@/lib/compliance/staffing-action-sla-breach-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  deliverStaffingSlaBreachDigestAction,
  updateStaffingSlaBreachDigestSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Staffing SLA breach digest",
  description:
    "Weekly email and Slack when open staffing actions exceed the committee completion SLA past peak week.",
};

export const dynamic = "force-dynamic";

export default async function StaffingSlaBreachDigestPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    delivered?: string;
    breaches?: string;
    emails?: string;
    slack?: string;
    saved?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Staffing SLA breach digest"
        description="Sign in to configure staffing SLA breach digests."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/staffing-sla-breach-digest");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildStaffingSlaBreachDigestPack(user.id, { orgId: orgContext.orgId, supabase })
    : null;

  const settings = orgContext.orgId
    ? await getStaffingSlaBreachDigestOrgSettings(orgContext.orgId, supabase)
    : null;

  const deliveries = orgContext.orgId
    ? await listStaffingSlaBreachDigestDeliveries(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;
  const slaDays = pack?.settings.slaDaysAfterPeakWeek ?? DEFAULT_STAFFING_SLA_DAYS_AFTER_PEAK_WEEK;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Staffing action SLA breach digest"
        description={`Weekly digest when open staffing actions remain incomplete more than ${slaDays} day(s) after the forecast peak week ends — distinct from immediate overdue nudges.`}
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />

      {typeof sp.delivered === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>
          Digest delivered — {sp.breaches ?? "0"} breach(es), {sp.emails ?? "0"} email(s)
          {sp.slack === "1" ? ", Slack sent" : ""}.
        </p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Settings saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="SLA breach digest unavailable"
          description="Join an organization with tracked staffing actions to evaluate SLA breaches."
          ctas={[
            { href: "/governance/compliance/staffing-actions", label: "Staffing actions" },
            { href: "/governance/compliance/staffing-action-reminders", label: "Overdue reminders" },
          ]}
        />
      ) : (
        <>
          <SlaBreachStatus breachCount={pack.breachItems.length} summary={pack.committeeSummary} />

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DigestStatCard label="SLA window" value={`${slaDays}d`} />
            <DigestStatCard label="Breaches" value={String(pack.breachItems.length)} />
            <DigestStatCard label="Past peak (in SLA)" value={String(pack.overdueNotYetBreachCount)} />
            <DigestStatCard
              label="Last delivery"
              value={pack.lastDeliveryAt?.slice(0, 10) ?? "Never"}
              small
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/staffing-sla-breach-digest?format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/staffing-sla-breach-digest?format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          {canEdit ? (
            <ConsolePanel title="Digest settings">
              <form
                action={updateStaffingSlaBreachDigestSettingsAction}
                className={`space-y-4 ${appBody}`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="digest_enabled"
                    defaultChecked={settings?.digestEnabled}
                    className="rounded border-border"
                  />
                  <span>Enable SLA breach digest evaluation</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="email_enabled"
                    defaultChecked={settings?.emailEnabled}
                    className="rounded border-border"
                  />
                  <span>Email owners and admins</span>
                </label>
                <div>
                  <label className={appLabel} htmlFor="sla_days">
                    Completion SLA (days after peak week end)
                  </label>
                  <input
                    id="sla_days"
                    name="sla_days"
                    type="number"
                    min={0}
                    max={90}
                    defaultValue={settings?.slaDaysAfterPeakWeek ?? slaDays}
                    className="mt-1 w-32 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                >
                  Save settings
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={deliverStaffingSlaBreachDigestAction}>
                  <button
                    type="submit"
                    disabled={pack.breachItems.length === 0}
                    className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20 disabled:opacity-40"
                  >
                    Send digest now
                  </button>
                </form>
                {pack.breachItems.length > 0 ? (
                  <form action={deliverStaffingSlaBreachDigestAction}>
                    <input type="hidden" name="force" value="1" />
                    <button
                      type="submit"
                      className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                    >
                      Force resend this week
                    </button>
                  </form>
                ) : null}
              </div>
              <p className={`mt-3 ${appMeta} text-muted`}>
                Slack:{" "}
                <code className="text-foreground/80">ZENTRO_SLACK_NOTIFY_STAFFING_SLA_BREACH</code>
                {" · "}
                Cron:{" "}
                <code className="text-foreground/80">
                  ZENTRO_STAFFING_SLA_BREACH_DIGEST_CRON_SECRET
                </code>
              </p>
            </ConsolePanel>
          ) : null}

          {pack.breachItems.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="SLA breach queue">
                <ul className={`space-y-2 ${appMeta}`}>
                  {pack.breachItems.map((item) => (
                    <li
                      key={item.action.id}
                      className="rounded-lg border border-white/[0.06] px-3 py-2"
                    >
                      <span className="font-medium text-foreground">{item.action.title}</span>
                      {" · "}
                      {item.action.status}
                      {" · +"}
                      {item.daysPastPeakWeek}d past peak
                      {" · +"}
                      {item.daysPastSla}d past SLA
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}

          {deliveries.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="Delivery log">
                <ul className={`space-y-2 ${appMeta}`}>
                  {deliveries.map((row) => (
                    <li key={row.id} className="rounded-lg border border-white/[0.06] px-3 py-2">
                      <span className="font-mono text-xs text-muted">
                        {row.createdAt.slice(0, 19)}
                      </span>
                      {" · "}
                      SLA {row.slaDaysAfterPeakWeek}d · {row.breachCount} breach(es) · max +
                      {row.maxDaysPastPeak}d
                      {row.slackSent ? " · Slack" : ""}
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}

          <p className={`mt-6 ${appMeta}`}>
            <Link
              href="/governance/compliance/staffing-action-reminders"
              className="text-accent hover:underline"
            >
              Overdue reminders
            </Link>
            {" · "}
            <Link
              href="/governance/compliance/staffing-completion-rollup"
              className="text-accent hover:underline"
            >
              Completion rollup
            </Link>
          </p>
        </>
      )}
    </>
  );
}

function SlaBreachStatus({
  breachCount,
  summary,
}: {
  breachCount: number;
  summary: string;
}) {
  return (
    <div
      className={`mb-6 rounded-xl border px-4 py-3 ${breachCount > 0 ? "border-danger/40 bg-danger/10" : "border-emerald-500/30 bg-emerald-500/5"}`}
    >
      <p className={appOverline}>SLA breach status</p>
      <p
        className={`mt-1 font-semibold ${breachCount > 0 ? "text-danger" : "text-emerald-300"} ${appBody}`}
      >
        {breachCount > 0 ? `${breachCount} SLA breach(es)` : "No SLA breaches"}
      </p>
      <p className={`mt-2 ${appMeta} text-muted`}>{summary}</p>
    </div>
  );
}

function DigestStatCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
      <p className={appOverline}>{label}</p>
      <p
        className={`mt-1 font-semibold text-foreground ${small ? `text-sm ${appBody}` : `text-2xl ${appBody}`}`}
      >
        {value}
      </p>
    </div>
  );
}
