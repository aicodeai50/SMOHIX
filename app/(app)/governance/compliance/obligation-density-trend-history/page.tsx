import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildObligationDensityTrendHistoryPack } from "@/lib/compliance/obligation-density-trend-history";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Obligation density trend history",
  description:
    "Trailing-quarter weekly obligation density and alert breach deliveries for capacity planning.",
};

export const dynamic = "force-dynamic";

const TRAILING_DAYS = 90;

function barWidth(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "0%";
  return `${Math.min(100, Math.round((value / max) * 100))}%`;
}

export default async function ObligationDensityTrendHistoryPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Obligation density trend history"
        description="Sign in to view trailing-quarter density and alert trends."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      "/auth/sign-in?next=/governance/compliance/obligation-density-trend-history",
    );
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildObligationDensityTrendHistoryPack(user.id, {
        orgId: orgContext.orgId,
        trailingDays: TRAILING_DAYS,
        supabase,
      })
    : null;

  const trailingPoints = pack?.points.filter((p) => !p.isFuture) ?? [];
  const forwardPoints = pack?.points.filter((p) => p.isFuture) ?? [];
  const maxObligations = Math.max(
    1,
    ...(pack?.points.map((p) => p.obligationCount) ?? [1]),
  );
  const threshold = pack?.settings.weeklyThreshold ?? 8;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Obligation density trend history"
        description="Trailing-quarter weekly obligation counts by due week plus density alert deliveries — with forward forecast weeks for capacity planning."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Trend history unavailable"
          description="Join an organization with compliance obligations to build density trend history."
          ctas={[
            { href: "/governance/compliance/obligation-density-alerts", label: "Density alerts" },
            { href: "/governance/compliance/obligation-forecast", label: "Forecast" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/obligation-density-trend-history?trailingDays=${TRAILING_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/obligation-density-trend-history?trailingDays=${TRAILING_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Trailing peak</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.peakTrailingCount}
              </p>
              <p className={appMeta}>{pack.peakTrailingWeekKey ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Alert deliveries</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.totalAlertDeliveries}
              </p>
              <p className={appMeta}>{pack.weeksWithAlerts} week(s) with alerts</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Weekly threshold</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {threshold}
              </p>
              <p className={appMeta}>Peak threshold {pack.settings.peakThreshold}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Forward peak</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.forwardPeakCount}
              </p>
              <p className={appMeta}>{pack.forwardPeakWeekKey ?? "—"}</p>
            </div>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>{pack.capacitySummary}</p>

          <PlaceholderCard title="Trailing quarter — obligations due per week">
            <ul className={`space-y-3 ${appBody}`}>
              {trailingPoints.map((p) => (
                <li key={p.weekKey}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={p.isCurrentWeek ? "font-semibold text-accent" : ""}>
                      {p.weekLabel}
                      {p.isCurrentWeek ? " (current)" : ""}
                    </span>
                    <span className={appMeta}>
                      {p.obligationCount} obligations
                      {p.alertDeliveryCount > 0
                        ? ` · ${p.alertDeliveryCount} alert(s)`
                        : ""}
                      {p.aboveWeeklyThreshold ? (
                        <span className="text-danger"> · above threshold</span>
                      ) : null}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${p.aboveWeeklyThreshold ? "bg-danger/70" : "bg-accent/60"}`}
                      style={{ width: barWidth(p.obligationCount, maxObligations) }}
                    />
                  </div>
                  {threshold > 0 ? (
                    <div
                      className="relative -mt-2 h-0 border-t border-dashed border-danger/40"
                      style={{
                        width: barWidth(threshold, maxObligations),
                        marginLeft: 0,
                      }}
                      title={`Threshold ${threshold}`}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </PlaceholderCard>

          {forwardPoints.length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Forward forecast weeks">
                <ul className={`space-y-3 ${appBody}`}>
                  {forwardPoints.map((p) => (
                    <li key={p.weekKey}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted">{p.weekLabel}</span>
                        <span className={appMeta}>
                          {p.obligationCount} projected
                          {p.aboveWeeklyThreshold ? (
                            <span className="text-amber-200"> · above threshold</span>
                          ) : null}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-indigo-400/50"
                          style={{ width: barWidth(p.obligationCount, maxObligations) }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}

          {pack.totalAlertDeliveries > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Alert types in trailing quarter">
                <p className={appMeta}>
                  Deliveries from{" "}
                  <Link
                    href="/governance/compliance/obligation-density-alerts"
                    className="text-accent hover:underline"
                  >
                    density alerts
                  </Link>{" "}
                  log — weekly_density, peak_week, overdue_spike.
                </p>
              </PlaceholderCard>
            </div>
          ) : null}

          <p className={`mt-6 ${appMeta}`}>
            <Link
              href="/governance/compliance/obligation-density-alerts"
              className="text-accent hover:underline"
            >
              Density alerts
            </Link>
            {" · "}
            <Link
              href="/governance/compliance/obligation-forecast"
              className="text-accent hover:underline"
            >
              Forecast timeline
            </Link>
            {" · "}
            <Link href="/governance/compliance/kpi-trends" className="text-accent hover:underline">
              KPI trends
            </Link>
          </p>
        </>
      )}
    </>
  );
}
