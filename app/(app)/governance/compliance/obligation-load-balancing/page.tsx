import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildObligationOwnerLoadBalancingPack } from "@/lib/compliance/obligation-owner-load-balancing";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Obligation load balancing",
  description:
    "Suggest redistributing peak-week obligations across RACI accountable owners.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

export default async function ObligationLoadBalancingPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Obligation load balancing"
        description="Sign in to view peak-week owner load and rebalance suggestions."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-load-balancing");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildObligationOwnerLoadBalancingPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  const maxLoad = Math.max(1, ...(pack?.ownerLoads.map((o) => o.peakWeekObligationCount) ?? [1]));

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Obligation owner load balancing"
        description="Maps forecast peak-week obligations to RACI primary accountables per framework and suggests transfers from overloaded to underloaded owners."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Load balancing unavailable"
          description="Join an organization with ownership matrix and forecast obligations to generate rebalance suggestions."
          ctas={[
            { href: "/governance/compliance/control-ownership", label: "Ownership matrix" },
            { href: "/governance/compliance/committee-capacity-budget", label: "Capacity budget" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/obligation-load-balancing?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/obligation-load-balancing?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Peak week</p>
              <p className={`mt-1 text-sm font-semibold text-foreground ${appBody}`}>
                {pack.peakWeekLabel ?? pack.peakWeekKey ?? "—"}
              </p>
              <p className={appMeta}>{pack.peakWeekObligationCount} obligations</p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${pack.imbalanceScore >= 2 ? "border-danger/40 bg-danger/10" : "border-border bg-surface/40"}`}
            >
              <p className={appOverline}>Imbalance score</p>
              <p
                className={`mt-1 text-2xl font-semibold ${pack.imbalanceScore >= 2 ? "text-danger" : "text-foreground"} ${appBody}`}
              >
                {pack.imbalanceScore}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Owners in peak week</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.ownerLoads.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Suggestions</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.suggestions.length}
              </p>
            </div>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>{pack.committeeSummary}</p>

          {pack.ownerLoads.length > 0 ? (
            <PlaceholderCard title="Peak-week owner load">
              <ul className={`space-y-3 ${appBody}`}>
                {pack.ownerLoads.map((o) => (
                  <li key={o.userId}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{o.label}</span>
                      <span className={appMeta}>
                        {o.peakWeekObligationCount} items · {o.estimatedHours}h
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-accent/60"
                        style={{
                          width: `${Math.min(100, Math.round((o.peakWeekObligationCount / maxLoad) * 100))}%`,
                        }}
                      />
                    </div>
                    {o.accountableFrameworks.length > 0 ? (
                      <p className={`mt-1 font-mono text-xs text-muted`}>
                        {o.accountableFrameworks.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </PlaceholderCard>
          ) : null}

          {pack.suggestions.length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Rebalance suggestions">
                <ul className={`space-y-3 ${appBody}`}>
                  {pack.suggestions.map((s) => (
                    <li
                      key={`${s.obligationId}-${s.toOwnerUserId}`}
                      className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3"
                    >
                      <p className="font-medium text-foreground">{s.obligationTitle}</p>
                      <p className={`mt-1 ${appMeta} text-muted`}>
                        {s.fromOwnerLabel} → <span className="text-accent">{s.toOwnerLabel}</span>
                        {s.framework ? ` · ${s.framework}` : ""}
                      </p>
                      <p className={`mt-2 ${appMeta}`}>{s.reason}</p>
                      <Link
                        href={`/governance/compliance/evidence-requests`}
                        className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                      >
                        Review obligations
                      </Link>
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}

          {pack.frameworkOwners.length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Framework primary accountables">
                <ul className={`space-y-2 ${appMeta}`}>
                  {pack.frameworkOwners.map((fw) => (
                    <li key={fw.framework} className="rounded-lg border border-white/[0.06] px-3 py-2">
                      <span className="font-mono text-xs text-muted">{fw.framework}</span>
                      {" · "}
                      {fw.label} ({fw.controlCount} controls)
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}

          <p className={`mt-6 ${appMeta}`}>
            <Link
              href="/governance/compliance/committee-capacity-budget"
              className="text-accent hover:underline"
            >
              Capacity budget
            </Link>
            {" · "}
            <Link href="/governance/compliance/control-ownership" className="text-accent hover:underline">
              Ownership matrix
            </Link>
            {" · "}
            <Link href="/governance/compliance/obligation-whatif" className="text-accent hover:underline">
              What-if scenarios
            </Link>
          </p>
        </>
      )}
    </>
  );
}
