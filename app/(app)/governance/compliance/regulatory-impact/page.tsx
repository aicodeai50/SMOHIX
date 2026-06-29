import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildRegulatoryChangeImpactPack } from "@/lib/compliance/regulatory-change-impact";
import type { RegulatoryImpactKind } from "@/lib/compliance/regulatory-change-impact";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Regulatory change impact",
  description: "Simulate how regulatory updates shift control coverage and evidence requirements.",
};

export const dynamic = "force-dynamic";

const KIND_STYLE: Record<RegulatoryImpactKind, string> = {
  new_obligation: "text-danger border-danger/35 bg-danger/10",
  evidence_refresh: "text-amber-200 border-amber-500/30 bg-amber-500/10",
  scope_expansion: "text-indigo-200 border-indigo-400/30 bg-indigo-500/10",
  reporting_change: "text-muted border-white/[0.12] bg-white/[0.04]",
};

export default async function RegulatoryImpactPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Regulatory change impact"
        description="Sign in to simulate regulatory shifts against live control coverage."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/regulatory-impact");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildRegulatoryChangeImpactPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  const topResult = pack?.results[0] ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Regulatory change impact simulator"
        description="Models how curated regulatory updates affect your live readiness — using org audit_log and accepted policy coverage, not mock scores."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Impact simulator unavailable"
          description="Join an organization with compliance baseline data to run regulatory scenarios."
          ctas={[
            { href: "/governance/compliance/baseline-comparison", label: "All frameworks" },
            { href: "/governance/compliance/program", label: "Program dashboard" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/regulatory-impact?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/regulatory-impact?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <span className={`${appMeta} text-muted`}>Catalog {pack.catalogVersion}</span>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Scenarios</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.scenarios.length}
              </p>
            </div>
            <div className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3">
              <p className={appOverline}>Highest impact</p>
              <p className={`mt-1 text-sm font-semibold text-danger ${appBody}`}>
                {topResult?.scenario.regulation ?? "—"}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                −{topResult?.projectedReadinessDrop ?? 0} readiness index
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Controls touched</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {topResult?.impactedControlCount ?? 0}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>{pack.periodDays}d baseline</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Evidence refresh</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {topResult?.refreshRequiredCount ?? 0}
              </p>
            </div>
          </div>

          <ConsolePanel title="Scenario rankings">
            <ul className={`space-y-3 ${appBody}`}>
              {pack.results.map((result) => (
                <li
                  key={result.scenario.id}
                  className="rounded-lg border border-white/[0.08] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {result.scenario.regulation} · {result.scenario.effectiveLabel}
                      </p>
                      <p className="font-medium text-foreground">{result.scenario.title}</p>
                      <p className={`mt-1 ${appMeta} text-muted`}>{result.scenario.summary}</p>
                    </div>
                    <span className="text-sm font-semibold text-danger">
                      −{result.projectedReadinessDrop} index
                    </span>
                  </div>
                  {result.frameworkDeltas.length > 0 ? (
                    <p className={`mt-2 font-mono text-xs text-foreground/80`}>
                      {result.frameworkDeltas
                        .slice(0, 4)
                        .map((f) => `${f.label} ${f.currentReadiness}%→${f.projectedReadiness}%`)
                        .join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </ConsolePanel>

          {topResult ? (
            <div className="mt-6">
              <ConsolePanel title={`Top scenario — ${topResult.scenario.title}`}>
                <ul className={`space-y-3 ${appBody}`}>
                  {topResult.rows.map((row) => (
                    <li
                      key={`${row.scenarioId}-${row.controlId}`}
                      className={`rounded-lg border px-4 py-3 ${KIND_STYLE[row.kind] ?? ""}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-mono text-sm text-foreground">{row.controlId}</p>
                        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                          {row.kind.replace(/_/g, " ")} · {row.currentStatus} → {row.simulatedStatus}
                        </span>
                      </div>
                      <p className={`mt-2 ${appMeta} text-muted`}>{row.note}</p>
                      <Link
                        href={row.href}
                        className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                      >
                        Open framework
                      </Link>
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
