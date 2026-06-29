import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  BENCHMARK_FRAMEWORK_ORDER,
  buildControlBenchmarkPack,
  peerBandLabel,
  peerBandStyle,
} from "@/lib/compliance/control-benchmark";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Control benchmarking",
  description: "Compare live org readiness percentiles against industry reference baselines.",
};

export const dynamic = "force-dynamic";

function barWidth(percent: number): string {
  return `${Math.max(4, Math.min(100, percent))}%`;
}

export default async function ControlBenchmarkingPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Control benchmarking"
          description="Sign in to compare readiness against industry reference cohorts."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/benchmarking");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildControlBenchmarkPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        auditorReadOnly: readOnly,
        supabase,
      })
    : null;

  const rowByFramework = new Map(pack?.rows.map((r) => [r.framework, r]) ?? []);

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Continuous control benchmarking"
        description="Your organization's live readiness from audit_log and policy evidence, compared to anonymized industry percentile bands (p25–p90) when reference benchmarks are available."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Benchmarking unavailable"
          description="Join an organization with compliance data to compare against industry reference baselines."
          ctas={[{ href: "/governance/compliance/baseline-comparison", label: "Baseline comparison" }]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/benchmarking?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/benchmarking?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/baseline-comparison"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Baseline comparison
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 lg:col-span-2">
              <p className={appOverline}>Org readiness (live)</p>
              <p className={`mt-1 text-3xl font-semibold text-accent ${appBody}`}>
                {pack.orgOverallReadiness}%
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {pack.periodDays}d evidence window · catalog {pack.benchmarkCatalogVersion}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Estimated peer percentile</p>
              <p className={`mt-1 text-2xl font-semibold ${pack.orgOverallBand ? peerBandStyle(pack.orgOverallBand) : "text-foreground"} ${appBody}`}>
                {pack.orgOverallPercentile !== null ? `${pack.orgOverallPercentile}th` : "—"}
              </p>
              {pack.orgOverallBand ? (
                <p className={`mt-1 ${appMeta} text-muted`}>{peerBandLabel(pack.orgOverallBand)}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Above / below median</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.aboveMedianCount} / {pack.belowMedianCount}
              </p>
            </div>
          </div>

          <ConsolePanel title="Framework vs industry cohort">
            <div className="overflow-x-auto">
              <table className={`w-full text-left ${appBody}`}>
                <thead className="border-b border-border text-[10px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Framework</th>
                    <th className="px-3 py-2">Your readiness</th>
                    <th className="px-3 py-2">Industry p50</th>
                    <th className="px-3 py-2">Δ vs median</th>
                    <th className="px-3 py-2">Percentile</th>
                    <th className="px-3 py-2">Peer band</th>
                    <th className="px-3 py-2">Distribution</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border ${appMeta}`}>
                  {BENCHMARK_FRAMEWORK_ORDER.map((fw) => {
                    const row = rowByFramework.get(fw);
                    if (!row || !row.industry) return null;
                    const ind = row.industry;
                    return (
                      <tr key={fw}>
                        <td className="px-3 py-3">
                          <Link href={row.consolePath} className="text-accent hover:underline">
                            {row.label}
                          </Link>
                          <p className="text-muted">{ind.cohortLabel}</p>
                        </td>
                        <td className="px-3 py-3 font-semibold text-foreground">
                          {row.orgReadinessPercent}%
                        </td>
                        <td className="px-3 py-3">{ind.p50}%</td>
                        <td
                          className={`px-3 py-3 ${(row.deltaVsMedian ?? 0) >= 0 ? "text-emerald-300" : "text-danger"}`}
                        >
                          {row.deltaVsMedian !== null
                            ? `${row.deltaVsMedian >= 0 ? "+" : ""}${row.deltaVsMedian}`
                            : "—"}
                        </td>
                        <td className="px-3 py-3">{row.percentile}th</td>
                        <td
                          className={`px-3 py-3 capitalize ${row.peerBand ? peerBandStyle(row.peerBand) : ""}`}
                        >
                          {row.peerBand ? peerBandLabel(row.peerBand) : "—"}
                        </td>
                        <td className="px-3 py-3 min-w-[200px]">
                          <div className="relative h-6 rounded bg-white/[0.06]">
                            <div
                              className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-muted"
                              style={{ left: barWidth(ind.p25) }}
                              title={`p25 ${ind.p25}%`}
                            />
                            <div
                              className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-foreground/40"
                              style={{ left: barWidth(ind.p50) }}
                              title={`p50 ${ind.p50}%`}
                            />
                            <div
                              className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-muted"
                              style={{ left: barWidth(ind.p75) }}
                              title={`p75 ${ind.p75}%`}
                            />
                            <div
                              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-accent/30"
                              style={{ left: barWidth(row.orgReadinessPercent) }}
                              title={`You ${row.orgReadinessPercent}%`}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-muted">
                            p25 {ind.p25} · p50 {ind.p50} · p75 {ind.p75}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className={`mt-4 ${appMeta} text-muted`}>
              Industry bands are anonymized aggregate reference data ({pack.benchmarkCatalogVersion}
              ), not peer-identifiable customer data. Your scores are computed from live org{" "}
              <code className="text-foreground/80">audit_log</code> and accepted policies.
            </p>
          </ConsolePanel>
        </>
      )}
    </>
  );
}
