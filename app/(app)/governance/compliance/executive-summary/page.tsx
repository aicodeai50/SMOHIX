import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { ExecutiveSummaryPrintButton } from "@/components/compliance/ExecutiveSummaryPrintButton";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { heatLevelBgClass } from "@/lib/compliance/compliance-risk-heatmap";
import { buildGrcExecutiveSummary } from "@/lib/compliance/grc-executive-summary";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "GRC executive summary",
  description: "Board-ready one-page rollup of program readiness, risk hotspots, and attestation status.",
};

export const dynamic = "force-dynamic";

const LEVEL_LABEL: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  critical: "Critical",
};

export default async function GrcExecutiveSummaryPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="GRC executive summary"
          description="Sign in to generate a board-ready compliance rollup from live org data."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/executive-summary");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildGrcExecutiveSummary(user.id, {
        orgId: orgContext.orgId,
        orgName: orgContext.orgName,
        periodDays: 30,
        auditorReadOnly: readOnly,
        supabase,
      })
    : null;

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          eyebrow="Governance"
          title="Board-ready GRC executive summary"
          description="One-page leadership rollup from live program readiness, risk heatmap hotspots, attestations, and third-party posture — suitable for print or PDF export."
        />
        <ComplianceHubLinks className={`-mt-4 mb-4 ${appBody}`} />
        {readOnly ? (
          <p className={`-mt-2 mb-4 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
        ) : null}
      </div>

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Summary unavailable"
          description="Join an organization with compliance features to generate an executive summary."
          ctas={[{ href: "/governance/compliance/program", label: "Program dashboard" }]}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
            <ExecutiveSummaryPrintButton />
            <a
              href="/api/governance/compliance/executive-summary?periodDays=30&format=html"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Open print HTML
            </a>
            <a
              href="/api/governance/compliance/executive-summary?periodDays=30&format=markdown"
              className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Download Markdown
            </a>
            <a
              href="/api/governance/compliance/executive-summary?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Download JSON
            </a>
          </div>

          <article
            id="grc-executive-summary"
            className="grc-executive-sheet rounded-2xl border border-border bg-surface/50 p-6 sm:p-8 print:border-0 print:bg-white print:p-0 print:text-black"
          >
            <header className="border-b border-white/[0.08] pb-4 print:border-black/20">
              <p className={`${appOverline} print:text-black/60`}>GRC executive summary</p>
              <h2 className={`mt-1 text-xl font-semibold text-foreground print:text-black sm:text-2xl ${appBody}`}>
                {pack.orgName ?? "Organization"}
              </h2>
              <p className={`mt-1 ${appMeta} text-muted print:text-black/70`}>
                Generated {new Date(pack.generatedAt).toLocaleString()} · {pack.periodDays}-day assessment
                window
              </p>
            </header>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
              <div className="rounded-lg border border-border px-3 py-2 print:border-black/20">
                <p className={appOverline}>Program readiness</p>
                <p className={`text-2xl font-semibold text-accent print:text-black ${appBody}`}>
                  {pack.programReadinessPercent}%
                </p>
              </div>
              <div
                className={`rounded-lg border px-3 py-2 print:border-black/20 ${heatLevelBgClass(pack.overallRiskLevel)} print:bg-transparent`}
              >
                <p className={appOverline}>Risk concentration</p>
                <p className={`text-2xl font-semibold print:text-black ${appBody}`}>
                  {pack.overallRiskScore}{" "}
                  <span className="text-sm font-normal">({LEVEL_LABEL[pack.overallRiskLevel]})</span>
                </p>
              </div>
              <div className="rounded-lg border border-border px-3 py-2 print:border-black/20">
                <p className={appOverline}>Overdue attestations</p>
                <p className={`text-2xl font-semibold text-danger print:text-black ${appBody}`}>
                  {pack.attestations.overdue}
                </p>
              </div>
              <div className="rounded-lg border border-border px-3 py-2 print:border-black/20">
                <p className={appOverline}>Open remediations</p>
                <p className={`text-2xl font-semibold print:text-black ${appBody}`}>
                  {pack.gapRemediations.open + pack.gapRemediations.inProgress}
                </p>
              </div>
            </div>

            <section className="mt-5">
              <h3 className={`${appOverline} text-foreground print:text-black`}>Framework readiness</h3>
              <table className={`mt-2 w-full text-left ${appMeta} print:text-black`}>
                <thead className="border-b border-border text-[10px] uppercase tracking-wide text-muted print:border-black/30 print:text-black/70">
                  <tr>
                    <th className="py-1 pr-2">Framework</th>
                    <th className="py-1 pr-2">Readiness</th>
                    <th className="py-1 pr-2">Risk</th>
                    <th className="py-1">Gaps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border print:divide-black/15">
                  {pack.frameworks.map((f) => (
                    <tr key={f.label}>
                      <td className="py-1.5 pr-2 text-foreground print:text-black">{f.label}</td>
                      <td className="py-1.5 pr-2">{f.readinessPercent}%</td>
                      <td className="py-1.5 pr-2">
                        {f.riskScore} ({LEVEL_LABEL[f.level]})
                      </td>
                      <td className="py-1.5">{f.exceptionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mt-5 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
              <div>
                <h3 className={`${appOverline} text-foreground print:text-black`}>Attestations</h3>
                <p className={`mt-1 ${appMeta} text-muted print:text-black/80`}>
                  {pack.attestations.attested} attested · {pack.attestations.pending} pending ·{" "}
                  {pack.attestations.overdue} overdue · {pack.attestations.total} total
                </p>
                <p className={`mt-2 ${appMeta} text-muted print:text-black/80`}>
                  Vendors: {pack.vendorCount} ({pack.criticalVendorCount} critical,{" "}
                  {pack.highTierVendorCount} high) · {pack.evidenceBundleCount} evidence bundles
                </p>
              </div>
              <div>
                <h3 className={`${appOverline} text-foreground print:text-black`}>Top risk hotspots</h3>
                {pack.hotspots.length === 0 ? (
                  <p className={`mt-1 ${appMeta} text-emerald-300 print:text-black/70`}>None elevated.</p>
                ) : (
                  <ul className={`mt-1 space-y-1 ${appMeta} print:text-black`}>
                    {pack.hotspots.slice(0, 4).map((h) => (
                      <li key={`${h.kind}-${h.ref}`}>
                        <span className="font-medium">{h.label}</span> ({h.riskScore}) — {h.detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="mt-5">
              <h3 className={`${appOverline} text-foreground print:text-black`}>Recommended board actions</h3>
              <ol className={`mt-2 list-decimal space-y-1 pl-5 ${appBody} print:text-black`}>
                {pack.leadershipActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </section>

            <footer className={`mt-6 border-t border-white/[0.08] pt-3 ${appMeta} text-muted print:border-black/20 print:text-black/60`}>
              Live data from org audit_log, accepted policies, and vendor register. Directional
              governance summary — not a contractual attestation.{" "}
              <Link href="/governance/compliance/program" className="text-accent print:hidden">
                Program dashboard
              </Link>
            </footer>
          </article>
        </>
      )}
    </>
  );
}
