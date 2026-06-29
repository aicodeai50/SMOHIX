import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { runAttackPathSimulationForUser } from "@/lib/attack-paths/data";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Attack paths",
  description: "What-if simulation from vulnerability entry points through service dependencies.",
};

export const dynamic = "force-dynamic";

const RISK_STYLE: Record<string, string> = {
  critical: "border-danger/40 bg-danger-dim/30 text-danger",
  high: "border-warning/40 bg-warning-dim/20 text-warning",
  medium: "border-accent/30 bg-accent/10 text-accent",
  low: "border-border bg-surface/40 text-muted",
};

export default async function AttackPathsPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Attack paths"
          description="Connect Supabase and sign in to simulate lateral movement through your dependency graph."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>
          Local mode does not run attack path simulation.
        </p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/assets/attack-paths");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const { paths, stats } = await runAttackPathSimulationForUser(supabase, user.id, orgContext.orgId);

  const criticalCount = paths.filter((p) => p.riskBand === "critical").length;
  const highCount = paths.filter((p) => p.riskBand === "high").length;

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title="Attack path simulation"
        description="Graph-based what-if: open high/critical findings on catalog services, pivots through dependency edges, targets production services."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/assets/vulnerabilities" className="text-accent hover:underline">
          Vulnerabilities
        </Link>
        {" · "}
        <Link href="/services" className="text-accent hover:underline">
          Service catalog & dependencies
        </Link>
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Simulated paths</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{paths.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Critical / high risk</p>
          <p className={`mt-1 text-2xl font-semibold text-warning ${appBody}`}>
            {criticalCount} / {highCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Entry services</p>
          <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{stats.entryServices}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Dependency edges</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{stats.dependencyEdges}</p>
        </div>
      </div>

      <ConsolePanel title="Ranked attack paths">
        {paths.length === 0 ? (
          <ConsoleEmptyState
            title="No paths simulated yet"
            description="Add dependency edges under Services, ingest high/critical vulnerability findings matched to catalog hosts, and mark production targets in service environment."
          />
        ) : (
          <ul className="divide-y divide-border">
            {paths.map((path) => (
              <li key={path.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className={`font-medium text-foreground ${appBody}`}>
                      {path.entryServiceName} → {path.targetServiceName}
                    </p>
                    <p className={`mt-1 text-muted ${appMeta}`}>
                      {path.hopCount} hop{path.hopCount === 1 ? "" : "s"} · {path.findingCount} entry finding
                      {path.findingCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${RISK_STYLE[path.riskBand] ?? RISK_STYLE.medium}`}
                  >
                    {path.riskScore} · {path.riskBand}
                  </span>
                </div>
                <ol className={`mt-3 space-y-1 border-l border-border pl-3 ${appMeta}`}>
                  {path.steps.map((step, idx) => (
                    <li key={`${path.id}-${step.serviceId}-${idx}`} className="text-muted">
                      <span className="text-foreground">{step.serviceName}</span>
                      {" — "}
                      {step.detail}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </ConsolePanel>
    </>
  );
}
