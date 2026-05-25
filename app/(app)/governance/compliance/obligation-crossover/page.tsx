import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { FRAMEWORK_CONSOLE_PATHS } from "@/lib/compliance/baseline-comparison";
import { buildObligationCrossoverReportPack } from "@/lib/compliance/obligation-crossover-report";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Obligation crossover report",
  description:
    "Shared due windows and control overlap when one evidence artifact satisfies multiple framework obligations.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

const FRAMEWORK_LABELS: Partial<Record<ComplianceFramework, string>> = {
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF",
  cis_v8: "CIS v8",
  cmmc_l2: "CMMC L2",
  gdpr_art32: "GDPR Art. 32",
};

export default async function ObligationCrossoverPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Obligation crossover report"
        description="Sign in to view multi-framework obligation overlap and evidence reuse opportunities."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-crossover");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildObligationCrossoverReportPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Multi-framework obligation crossover"
        description="Clusters open obligations that share catalog crosswalk links or aligned due windows — so one evidence collection pass can satisfy multiple framework packs."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with attestations, testing schedules, or assessor requests to generate the crossover report."
          ctas={[
            { href: "/governance/compliance/obligation-heatmap", label: "Obligation heatmap" },
            { href: "/governance/compliance/control-graph", label: "Control graph" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/obligation-crossover?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 hover:text-foreground"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/obligation-crossover?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 hover:text-foreground"
            >
              Export JSON
            </a>
            <Link href="/governance/compliance/control-graph" className={`${appMeta} text-accent hover:underline`}>
              Control dependency graph
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3 lg:col-span-2">
              <p className={appOverline}>Open obligations</p>
              <p className={`mt-1 text-3xl font-semibold text-foreground ${appBody}`}>
                {pack.totalObligations}
                <span className={`ml-2 text-base font-normal ${appMeta}`}>{pack.horizonDays}d horizon</span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Crossover clusters</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.crossoverClusterCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Multi-framework obligations</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {pack.multiFrameworkObligationCount}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>Linked via catalog crosswalk</p>
            </div>
          </div>

          {pack.frameworkPairs.length > 0 ? (
            <PlaceholderCard title="Framework pair crossovers">
              <div className="overflow-x-auto">
                <table className={`w-full min-w-[480px] text-left ${appMeta}`}>
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted">
                      <th className="px-2 py-2">Pack A</th>
                      <th className="px-2 py-2">Pack B</th>
                      <th className="px-2 py-2 text-right">Shared obligations</th>
                      <th className="px-2 py-2 text-right">Linked controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pack.frameworkPairs.slice(0, 12).map((pair) => (
                      <tr key={`${pair.frameworkA}-${pair.frameworkB}`} className="border-b border-white/[0.06]">
                        <td className="px-2 py-2">
                          <Link
                            href={FRAMEWORK_CONSOLE_PATHS[pair.frameworkA]}
                            className="text-accent hover:underline"
                          >
                            {FRAMEWORK_LABELS[pair.frameworkA] ?? pair.frameworkA}
                          </Link>
                        </td>
                        <td className="px-2 py-2">
                          <Link
                            href={FRAMEWORK_CONSOLE_PATHS[pair.frameworkB]}
                            className="text-accent hover:underline"
                          >
                            {FRAMEWORK_LABELS[pair.frameworkB] ?? pair.frameworkB}
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-foreground">
                          {pair.sharedObligationCount}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-muted">
                          {pair.linkedControlCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PlaceholderCard>
          ) : null}

          <div className="mt-6">
            <PlaceholderCard title="Evidence reuse clusters">
              {pack.clusters.length === 0 ? (
                <p className={`${appMeta} text-emerald-300`}>
                  No multi-framework crossover clusters in the current horizon — obligations are isolated by
                  framework or due window.
                </p>
              ) : (
                <ul className={`space-y-4 ${appBody}`}>
                  {pack.clusters.slice(0, 15).map((cluster) => (
                    <li
                      key={cluster.id}
                      className="rounded-lg border border-white/[0.08] bg-surface/30 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {cluster.kind.replace("_", " ")} · {cluster.theme}
                          </p>
                          <p className="mt-1 font-medium text-foreground">
                            {cluster.frameworks
                              .map((fw) => FRAMEWORK_LABELS[fw] ?? fw)
                              .join(" · ")}
                          </p>
                          <p className={`mt-1 ${appMeta} text-muted`}>
                            {cluster.windowStart.slice(0, 10)} → {cluster.windowEnd.slice(0, 10)} ·{" "}
                            {cluster.obligationCount} obligations
                            {cluster.overdueCount > 0 ? (
                              <span className="text-danger"> · {cluster.overdueCount} overdue</span>
                            ) : null}
                          </p>
                          {cluster.controlRefs.length > 0 ? (
                            <p className={`mt-1 ${appMeta} text-foreground/80`}>
                              Controls: {cluster.controlRefs.join(", ")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <p className={`mt-2 ${appMeta} text-accent/90`}>{cluster.evidenceReuseNote}</p>
                    </li>
                  ))}
                </ul>
              )}
            </PlaceholderCard>
          </div>

          {pack.topReuseOpportunities.length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Top reuse opportunities">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.topReuseOpportunities.map((opp) => (
                    <li
                      key={opp.clusterId}
                      className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2"
                    >
                      <p className="font-medium text-foreground">{opp.title}</p>
                      <p className={`mt-1 ${appMeta} text-muted`}>{opp.evidenceReuseNote}</p>
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
