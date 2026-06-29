import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  BASELINE_COMPARISON_FRAMEWORKS,
  buildBaselineComparisonPack,
} from "@/lib/compliance/baseline-comparison";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Baseline comparison",
  description: "Side-by-side readiness and evidence deltas across all compliance framework packs.",
};

export const dynamic = "force-dynamic";

function deltaStyle(delta: number): string {
  if (delta > 0) return "text-emerald-300";
  if (delta < 0) return "text-danger";
  return "text-muted";
}

export default async function BaselineComparisonPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Baseline comparison"
          description="Sign in to compare framework readiness from live org audit and policy evidence."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/baseline-comparison");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildBaselineComparisonPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        auditorReadOnly: readOnly,
        supabase,
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Multi-framework baseline comparison"
        description="Live readiness scores and 30-day vs prior-30-day evidence deltas for every framework pack — built from your organization's audit_log and accepted automation policies, not sample data."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with compliance features to run a live baseline comparison across framework packs."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/baseline-comparison?periodDays=30&format=csv"
              className="inline-flex h-10 items-center rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent hover:bg-accent/15"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/baseline-comparison?periodDays=30&format=json"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 ${appBody}`}
            >
              Export JSON
            </a>
            <a
              href="/api/governance/compliance/baseline-comparison?periodDays=90&format=csv"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 ${appBody}`}
            >
              90-day window
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Frameworks compared</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.frameworkCount}
              </p>
              <p className={`${appMeta} text-muted`}>{BASELINE_COMPARISON_FRAMEWORKS.length} packs in catalog</p>
            </div>
            <div className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3">
              <p className={appOverline}>Lowest readiness</p>
              <p className={`mt-1 text-lg font-semibold text-warning ${appBody}`}>
                {pack.lowestReadinessFramework
                  ? pack.rows.find((r) => r.framework === pack.lowestReadinessFramework)?.label
                  : "—"}
              </p>
              <p className={`${appMeta} text-muted`}>
                {pack.lowestReadinessFramework
                  ? `${pack.rows.find((r) => r.framework === pack.lowestReadinessFramework)?.readinessPercent}%`
                  : ""}
              </p>
            </div>
            <div className="rounded-xl border border-danger/30 bg-danger-dim/40 px-4 py-3">
              <p className={appOverline}>Most regressions</p>
              <p className={`mt-1 text-lg font-semibold text-danger ${appBody}`}>
                {pack.largestRegressionFramework
                  ? pack.rows.find((r) => r.framework === pack.largestRegressionFramework)?.label
                  : "None"}
              </p>
              <p className={`${appMeta} text-muted`}>
                {pack.largestRegressionFramework
                  ? `${pack.rows.find((r) => r.framework === pack.largestRegressionFramework)?.regressed} control(s)`
                  : "No regressions in window"}
              </p>
            </div>
          </div>

          <ConsolePanel title="Framework baseline matrix">
            <div className="overflow-x-auto">
              <table className={`w-full text-left ${appBody}`}>
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2">Framework</th>
                    <th className="px-3 py-2">Readiness</th>
                    <th className="px-3 py-2">Δ vs prior {pack.periodDays}d</th>
                    <th className="px-3 py-2">Evidence mix</th>
                    <th className="px-3 py-2">Trends</th>
                    <th className="px-3 py-2">Gaps</th>
                    <th className="px-3 py-2">Detail</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-border ${appMeta}`}>
                  {pack.rows.map((row) => (
                    <tr key={row.framework}>
                      <td className="px-3 py-3">
                        <span className="font-medium text-foreground">{row.label}</span>
                        <span className="block text-muted">{row.controlCount} controls</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-lg font-semibold text-foreground">{row.readinessPercent}%</span>
                        <span className="block text-muted">was {row.priorReadinessPercent}%</span>
                      </td>
                      <td className={`px-3 py-3 font-semibold ${deltaStyle(row.readinessDelta)}`}>
                        {row.readinessDelta > 0 ? "+" : ""}
                        {row.readinessDelta}%
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {row.covered} covered · {row.partial} partial · {row.none} none
                      </td>
                      <td className="px-3 py-3 text-muted">
                        <span className="text-emerald-300">+{row.improved}</span>
                        {" · "}
                        <span>{row.unchanged} =</span>
                        {" · "}
                        <span className="text-danger">-{row.regressed}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-warning">{row.exceptionCount}</span>
                        {row.weakestDomain ? (
                          <span className="block text-muted">weak: {row.weakestDomain}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={row.consolePath} className="text-accent hover:underline">
                          Open pack
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={`mt-4 ${appMeta} text-muted`}>
              Data source: org-scoped <span className="font-mono text-foreground/80">audit_log</span> and
              accepted <span className="font-mono text-foreground/80">policy_suggestions</span> for window
              starting {pack.sinceIso.slice(0, 10)}. Prior period is the immediately preceding {pack.periodDays}{" "}
              days.
            </p>
          </ConsolePanel>
        </>
      )}
    </>
  );
}
