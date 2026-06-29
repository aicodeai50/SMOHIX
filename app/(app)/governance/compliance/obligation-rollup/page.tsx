import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildObligationExecutiveRollupPack } from "@/lib/compliance/obligation-executive-rollup";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Obligation executive rollup",
  description:
    "Printable board packet combining forecast, crossover, consolidation status, and evidence SLAs.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

export default async function ObligationExecutiveRollupPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Obligation executive rollup"
        description="Sign in to download the printable board obligation rollup."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-rollup");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildObligationExecutiveRollupPack(user.id, {
        orgId: orgContext.orgId,
        orgName: orgContext.orgName,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  const htmlUrl = `/api/governance/compliance/obligation-rollup?horizonDays=${HORIZON_DAYS}&format=html`;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Obligation executive rollup"
        description="Single printable document for board packets — forecast peak weeks, crossover reuse clusters, consolidation play progress, and assessor SLA breaches from live org data."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with compliance obligations to build the executive rollup."
          ctas={[
            { href: "/governance/compliance/committee-digest", label: "Committee digest" },
            { href: "/governance/compliance/obligation-forecast", label: "Forecast" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={htmlUrl}
              className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20"
            >
              Download printable HTML
            </a>
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Open for Print → PDF
            </a>
            <a
              href={`/api/governance/compliance/obligation-rollup?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <a
              href={`/api/governance/compliance/obligation-rollup?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
          </div>

          <div className="mb-6 rounded-xl border border-accent/25 bg-accent/5 px-4 py-3">
            <p className={appOverline}>Board summary</p>
            <p className={`mt-2 ${appBody} text-foreground/90`}>{pack.boardSummary}</p>
            <p className={`mt-3 ${appMeta} text-muted`}>
              Open the HTML file in a browser, then use Print → Save as PDF (same workflow as the
              committee meeting pack).
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Open obligations</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.forecast?.totalForecastObligations ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Peak week</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {pack.forecast?.peakWeekCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Crossover clusters</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.crossover?.crossoverClusterCount ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>SLA overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {pack.sla?.overdueCount ?? 0}
              </p>
            </div>
          </div>

          <ConsolePanel title="Rollup sections included">
            <ul className={`list-disc space-y-2 pl-5 ${appBody}`}>
              <li>
                <Link href="/governance/compliance/obligation-forecast" className="text-accent hover:underline">
                  Forecast timeline
                </Link>
                — weekly density and milestones
              </li>
              <li>
                <Link href="/governance/compliance/obligation-crossover" className="text-accent hover:underline">
                  Crossover report
                </Link>
                — multi-framework reuse clusters
              </li>
              <li>
                <Link
                  href="/governance/compliance/obligation-consolidation"
                  className="text-accent hover:underline"
                >
                  Consolidation playbook
                </Link>
                — play status and step completion
              </li>
              <li>
                <Link href="/governance/compliance/evidence-request-sla" className="text-accent hover:underline">
                  Evidence request SLAs
                </Link>
                — overdue and at-risk queue
              </li>
            </ul>
          </ConsolePanel>
        </>
      )}
    </>
  );
}
