import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildBoardObligationForecastPack } from "@/lib/compliance/board-obligation-forecast";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Board obligation forecast",
  description: "Forward-looking obligation density timeline for leadership and committee prep.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

function barWidth(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "0%";
  return `${Math.min(100, Math.round((value / max) * 100))}%`;
}

const URGENCY_STYLE: Record<string, string> = {
  overdue: "text-danger",
  due_soon: "text-amber-200",
  upcoming: "text-emerald-300",
};

export default async function BoardObligationForecastPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Board obligation forecast"
        description="Sign in to view the forward-looking obligation density timeline."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-forecast");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildBoardObligationForecastPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  const maxWeekly = Math.max(1, ...(pack?.buckets.map((b) => b.totalCount) ?? [1]));

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Board obligation forecast timeline"
        description="Weekly obligation density from live calendar, testing schedules, and assessor requests — built for committee and leadership prep, not static projections."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with compliance obligations to generate the board forecast timeline."
          ctas={[
            { href: "/governance/compliance/committee-meeting-pack", label: "Committee pack" },
            { href: "/governance/compliance/calendar", label: "GRC calendar" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/obligation-forecast?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 hover:text-foreground"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/obligation-forecast?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 hover:text-foreground"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/committee-meeting-pack"
              className={`${appMeta} text-accent hover:underline`}
            >
              Committee meeting pack
            </Link>
          </div>

          <div className="mb-6 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
            <p className={appOverline}>Committee summary</p>
            <p className={`mt-2 ${appBody} text-foreground/90`}>{pack.committeeSummary}</p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Open obligations</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.totalForecastObligations}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>{pack.horizonDays}d horizon</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Peak week</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {pack.peakWeekCount}
              </p>
              <p className={`mt-1 font-mono text-xs text-muted`}>{pack.peakWeekKey ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Overdue now</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {pack.currentOverdue}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Due ≤7 days</p>
              <p className={`mt-1 text-2xl font-semibold text-amber-200 ${appBody}`}>
                {pack.currentDueSoon}
              </p>
            </div>
          </div>

          <ConsolePanel title="Weekly obligation density">
            <ul className={`space-y-3 ${appBody}`}>
              {pack.buckets.map((bucket) => (
                <li
                  key={bucket.weekKey}
                  className={`rounded-lg border px-3 py-2 ${bucket.isCurrentWeek ? "border-accent/30 bg-accent/5" : "border-white/[0.08]"}`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs text-muted">
                      {bucket.weekLabel}
                      {bucket.isCurrentWeek ? (
                        <span className="ml-2 text-accent">current week</span>
                      ) : null}
                    </p>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {bucket.totalCount}
                    </span>
                  </div>
                  <div className="mb-2 h-3 rounded-full bg-white/[0.06]">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-accent/80 to-indigo-500/70"
                      style={{ width: barWidth(bucket.totalCount, maxWeekly) }}
                    />
                  </div>
                  <p className={`${appMeta} text-muted`}>
                    {bucket.overdueCount} overdue · {bucket.dueSoonCount} due ≤7d ·{" "}
                    {bucket.upcomingCount} upcoming
                    {bucket.byFramework.length > 0
                      ? ` · ${bucket.byFramework.map((f) => `${f.label} ${f.count}`).join(", ")}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </ConsolePanel>

          <div className="mt-6">
            <ConsolePanel title="Upcoming milestones">
              {pack.milestones.length === 0 ? (
                <p className={`${appMeta} text-emerald-300`}>No milestones in the forecast window.</p>
              ) : (
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.milestones.map((m) => (
                    <li
                      key={`${m.dueAt}-${m.title}`}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2"
                    >
                      <div>
                        <Link href={m.href} className="font-medium text-accent hover:underline">
                          {m.title}
                        </Link>
                        <p className={`${appMeta} text-muted`}>
                          {m.dueAt.slice(0, 10)} · {m.dimension}
                          {m.framework ? ` · ${m.framework}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${URGENCY_STYLE[m.urgency] ?? ""}`}
                      >
                        {m.urgency.replace("_", " ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </ConsolePanel>
          </div>
        </>
      )}
    </>
  );
}
