import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildCrossStaffingCommitteeEscalationPack,
  getCrossStaffingEscalationOrgSettings,
  listCrossStaffingEscalationDeliveries,
} from "@/lib/compliance/cross-staffing-committee-escalation";
import { DEFAULT_STAFFING_SLA_DAYS_AFTER_PEAK_WEEK } from "@/lib/compliance/staffing-action-sla-breach-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  deliverCrossStaffingEscalationAction,
  updateCrossStaffingEscalationSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Cross-staffing committee escalation",
  description:
    "Escalate SLA-breaching staffing actions to committee admins after the weekly completion rollup email.",
};

export const dynamic = "force-dynamic";

export default async function CrossStaffingCommitteeEscalationPage({
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
        title="Cross-staffing committee escalation"
        description="Sign in to configure committee escalations."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/cross-staffing-committee-escalation");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildCrossStaffingCommitteeEscalationPack(user.id, { orgId: orgContext.orgId, supabase })
    : null;

  const settings = orgContext.orgId
    ? await getCrossStaffingEscalationOrgSettings(orgContext.orgId, supabase)
    : null;

  const deliveries = orgContext.orgId
    ? await listCrossStaffingEscalationDeliveries(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;
  const slaDays = pack?.settings.slaDaysAfterPeakWeek ?? DEFAULT_STAFFING_SLA_DAYS_AFTER_PEAK_WEEK;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Cross-staffing committee escalation"
        description="Escalate to committee admins when SLA-breaching staffing actions remain open after the weekly completion rollup email — a third tier after overdue nudges and SLA breach digest."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />

      {typeof sp.delivered === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>
          Escalation delivered — {sp.breaches ?? "0"} breach(es), {sp.emails ?? "0"} email(s)
          {sp.slack === "1" ? ", Slack sent" : ""}.
        </p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Settings saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Escalation unavailable"
          description="Join an organization with tracked staffing actions to evaluate committee escalations."
          ctas={[
            { href: "/governance/compliance/staffing-actions", label: "Staffing actions" },
            { href: "/governance/compliance/staffing-completion-rollup", label: "Completion rollup" },
          ]}
        />
      ) : (
        <>
          <EscalationStatus
            eligible={pack.escalationEligible}
            breachCount={pack.breachItems.length}
            summary={pack.committeeSummary}
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Rollup this week" value={pack.rollupDelivery ? "Sent" : "Pending"} />
            <StatCard
              label="Rollup open @ send"
              value={pack.rollupDelivery ? String(pack.rollupDelivery.openCount) : "—"}
            />
            <StatCard label="SLA breaches" value={String(pack.breachItems.length)} />
            <StatCard
              label="Last escalation"
              value={pack.lastDeliveryAt?.slice(0, 10) ?? "Never"}
              small
            />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/cross-staffing-committee-escalation?format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/cross-staffing-committee-escalation?format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          {canEdit ? (
            <ConsolePanel title="Escalation settings">
              <form
                action={updateCrossStaffingEscalationSettingsAction}
                className={`space-y-4 ${appBody}`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="escalation_enabled"
                    defaultChecked={settings?.escalationEnabled}
                    className="rounded border-border"
                  />
                  <span>Enable committee escalation after rollup email</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="email_enabled"
                    defaultChecked={settings?.emailEnabled}
                    className="rounded border-border"
                  />
                  <span>Email committee admins</span>
                </label>
                <p className={appMeta}>
                  SLA threshold uses the same{" "}
                  <Link
                    href="/governance/compliance/staffing-sla-breach-digest"
                    className="text-accent hover:underline"
                  >
                    SLA breach digest
                  </Link>{" "}
                  setting ({slaDays} day(s) after peak week end).
                </p>
                <button
                  type="submit"
                  className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                >
                  Save settings
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={deliverCrossStaffingEscalationAction}>
                  <button
                    type="submit"
                    disabled={!pack.escalationEligible}
                    className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20 disabled:opacity-40"
                  >
                    Escalate now
                  </button>
                </form>
                {pack.escalationEligible ? (
                  <form action={deliverCrossStaffingEscalationAction}>
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
                <code className="text-foreground/80">ZENTRO_SLACK_NOTIFY_CROSS_STAFFING_ESCALATION</code>
                {" · "}
                Cron:{" "}
                <code className="text-foreground/80">
                  ZENTRO_CROSS_STAFFING_COMMITTEE_ESCALATION_CRON_SECRET
                </code>
              </p>
            </ConsolePanel>
          ) : null}

          {pack.breachItems.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="Escalation queue">
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
                      rollup had {row.rollupOpenCount} open · {row.breachCount} breach(es) · max +
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
              href="/governance/compliance/staffing-completion-rollup"
              className="text-accent hover:underline"
            >
              Completion rollup
            </Link>
            {" · "}
            <Link
              href="/governance/compliance/staffing-sla-breach-digest"
              className="text-accent hover:underline"
            >
              SLA breach digest
            </Link>
          </p>
        </>
      )}
    </>
  );
}

function EscalationStatus({
  eligible,
  breachCount,
  summary,
}: {
  eligible: boolean;
  breachCount: number;
  summary: string;
}) {
  return (
    <div
      className={`mb-6 rounded-xl border px-4 py-3 ${eligible ? "border-danger/40 bg-danger/10" : breachCount > 0 ? "border-warning/40 bg-warning/10" : "border-emerald-500/30 bg-emerald-500/5"}`}
    >
      <p className={appOverline}>Escalation status</p>
      <p
        className={`mt-1 font-semibold ${eligible ? "text-danger" : breachCount > 0 ? "text-warning" : "text-emerald-300"} ${appBody}`}
      >
        {eligible
          ? `Ready — ${breachCount} breach(es) after rollup`
          : breachCount > 0
            ? `${breachCount} breach(es) — waiting on rollup gate`
            : "No escalation required"}
      </p>
      <p className={`mt-2 ${appMeta} text-muted`}>{summary}</p>
    </div>
  );
}

function StatCard({
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
