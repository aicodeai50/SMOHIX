import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildBoardObligationWhatIfPack } from "@/lib/compliance/board-obligation-whatif";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Board obligation what-if",
  description:
    "Stress-test forecast density when obligations shift by weeks or frameworks are descoped.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

function deltaStyle(delta: number): string {
  if (delta < 0) return "text-emerald-300";
  if (delta > 0) return "text-danger";
  return "text-muted";
}

export default async function ObligationWhatIfPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Board obligation what-if"
        description="Sign in to run obligation forecast stress scenarios."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-whatif");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildBoardObligationWhatIfPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  const topRelief = pack?.results[0] ?? null;
  const baselineCurrent =
    pack?.baseline.buckets.find((b) => b.isCurrentWeek)?.totalCount ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Board obligation what-if scenarios"
        description="Stress-test live forecast density when obligations slip by N weeks or framework packs are descoped — compared to your baseline peak week and density alert thresholds."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="What-if simulator unavailable"
          description="Join an organization with open compliance obligations to run board what-if scenarios."
          ctas={[
            { href: "/governance/compliance/obligation-forecast", label: "Forecast" },
            { href: "/governance/compliance/obligation-density-alerts", label: "Density alerts" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/obligation-whatif?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/obligation-whatif?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Baseline peak week</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.baseline.peakWeekCount}
              </p>
              <p className={appMeta}>{pack.baseline.peakWeekKey ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Current week</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {baselineCurrent}
              </p>
              <p className={appMeta}>Threshold {pack.settings.weeklyThreshold}</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
              <p className={appOverline}>Best relief</p>
              <p className={`mt-1 text-sm font-semibold text-emerald-300 ${appBody}`}>
                {topRelief?.scenario.title ?? "—"}
              </p>
              <p className={appMeta}>
                Δ peak {topRelief?.peakWeekDelta ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Density breaches (baseline)</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.baselineBreachCount}
              </p>
              <p className={appMeta}>Peak thr. {pack.settings.peakThreshold}</p>
            </div>
          </div>

          <ConsolePanel title="Scenario rankings (peak week delta vs baseline)">
            <ul className={`space-y-3 ${appBody}`}>
              {pack.results.map((result) => (
                <li
                  key={result.scenario.id}
                  className="rounded-lg border border-white/[0.08] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{result.scenario.title}</p>
                      <p className={`mt-1 ${appMeta} text-muted`}>{result.scenario.summary}</p>
                    </div>
                    <span className={`text-sm font-semibold ${deltaStyle(result.peakWeekDelta)}`}>
                      {result.peakWeekDelta > 0 ? "+" : ""}
                      {result.peakWeekDelta} peak
                    </span>
                  </div>
                  <p className={`mt-2 font-mono text-xs text-foreground/80`}>
                    Simulated peak {result.simulated.peakWeekCount} ({result.simulated.peakWeekKey ?? "—"})
                    {" · "}
                    current week {result.currentWeekDelta >= 0 ? "+" : ""}
                    {result.currentWeekDelta}
                    {" · "}
                    obligations {result.totalObligationsDelta >= 0 ? "+" : ""}
                    {result.totalObligationsDelta}
                    {" · "}
                    breaches {result.simulatedBreachCount} (Δ{result.breachCountDelta >= 0 ? "+" : ""}
                    {result.breachCountDelta})
                  </p>
                  <p className={`mt-2 ${appMeta} text-muted`}>{result.capacityNote}</p>
                </li>
              ))}
            </ul>
          </ConsolePanel>

          {topRelief ? (
            <div className="mt-6">
              <ConsolePanel title={`Recommended relief — ${topRelief.scenario.title}`}>
                <p className={appBody}>{topRelief.capacityNote}</p>
                <p className={`mt-4 ${appMeta}`}>
                  <Link
                    href="/governance/compliance/obligation-forecast"
                    className="text-accent hover:underline"
                  >
                    Open baseline forecast
                  </Link>
                  {" · "}
                  <Link
                    href="/governance/compliance/obligation-density-trend-history"
                    className="text-accent hover:underline"
                  >
                    Density trends
                  </Link>
                </p>
              </ConsolePanel>
            </div>
          ) : null}

          <p className={`mt-6 ${appMeta} text-muted`}>
            Custom API:{" "}
            <code className="text-foreground/80">
              ?shiftWeeks=3&amp;excludeFrameworks=pcidss,hipaa&amp;excludeVendor=1
            </code>
          </p>
        </>
      )}
    </>
  );
}
