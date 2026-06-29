import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildObligationConsolidationPlaybookPack } from "@/lib/compliance/obligation-consolidation-playbook";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  startConsolidationPlayAction,
  updateConsolidationPlayStatusAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Obligation consolidation playbook",
  description:
    "Operator runbook steps to merge evidence collection for multi-framework crossover clusters.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

const STATUS_STYLE: Record<string, string> = {
  planned: "text-muted",
  in_progress: "text-accent",
  collected: "text-amber-200",
  verified: "text-emerald-300",
  dismissed: "text-muted",
};

export default async function ObligationConsolidationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; started?: string; updated?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Obligation consolidation playbook"
        description="Sign in to run consolidated evidence workflows for crossover clusters."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-consolidation");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildObligationConsolidationPlaybookPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Obligation consolidation playbook"
        description="Six-step operator workflow per crossover cluster — one evidence sprint instead of duplicate per-framework collection. Tracks progress in org-scoped consolidation plays."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {typeof sp.started === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Consolidation play started.</p>
      ) : null}
      {typeof sp.updated === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Play status updated.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with crossover clusters to generate consolidation playbooks."
          ctas={[
            { href: "/governance/compliance/obligation-crossover", label: "Crossover report" },
            { href: "/governance/compliance/runbooks", label: "Gap runbooks" },
          ]}
        />
      ) : pack.workflows.length === 0 ? (
        <ConsoleEmptyState
          title="No crossover clusters"
          description="The obligation crossover report has no multi-framework clusters in the current horizon — nothing to consolidate yet."
          ctas={[
            { href: "/governance/compliance/obligation-crossover", label: "Crossover report" },
            { href: "/governance/compliance/obligation-heatmap", label: "Obligation heatmap" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/obligation-consolidation?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 hover:text-foreground"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/obligation-consolidation?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 hover:text-foreground"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/obligation-crossover"
              className={`${appMeta} text-accent hover:underline`}
            >
              Crossover report
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Workflows</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.workflowCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>In progress</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {pack.stats.inProgress}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Collected</p>
              <p className={`mt-1 text-2xl font-semibold text-amber-200 ${appBody}`}>
                {pack.stats.collected}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Verified</p>
              <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>
                {pack.stats.verified}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Tracked plays</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.stats.tracked}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {pack.workflows.map((workflow) => {
              const status = workflow.play?.status ?? "planned";
              const completedSteps = workflow.steps.filter((s) => s.completed).length;
              return (
                <ConsolePanel
                  key={workflow.clusterKey}
                  title={`${workflow.frameworkLabels.join(" · ")} (${workflow.obligationCount} obligations)`}
                >
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${STATUS_STYLE[status] ?? ""}`}
                    >
                      {status.replace("_", " ")}
                    </span>
                    <span className={`${appMeta} text-muted`}>
                      {workflow.windowStart.slice(0, 10)} → {workflow.windowEnd.slice(0, 10)}
                      {workflow.overdueCount > 0 ? (
                        <span className="text-danger"> · {workflow.overdueCount} overdue</span>
                      ) : null}
                    </span>
                    <Link
                      href={`/runbooks/${workflow.runbookSlug}`}
                      className={`${appMeta} text-accent hover:underline`}
                    >
                      {workflow.runbookTitle}
                    </Link>
                    {workflow.playbookName ? (
                      <span className={`${appMeta} text-muted`}>· {workflow.playbookName}</span>
                    ) : null}
                    <span className={`${appMeta} text-muted`}>
                      {completedSteps}/{workflow.steps.length} steps
                    </span>
                  </div>
                  <p className={`mb-4 ${appMeta} text-foreground/85`}>{workflow.evidenceReuseNote}</p>

                  <ol className={`mb-4 list-decimal space-y-2 pl-5 ${appBody}`}>
                    {workflow.steps.map((step) => (
                      <li
                        key={step.order}
                        className={step.completed ? "text-emerald-300/90" : "text-foreground/90"}
                      >
                        {step.href ? (
                          <Link href={step.href} className="font-medium text-accent hover:underline">
                            {step.title}
                          </Link>
                        ) : (
                          <span className="font-medium">{step.title}</span>
                        )}
                        <span className={`block ${appMeta} text-muted`}>{step.description}</span>
                      </li>
                    ))}
                  </ol>

                  {!readOnly ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {!workflow.play ? (
                        <form action={startConsolidationPlayAction}>
                          <input type="hidden" name="cluster_id" value={workflow.clusterId} />
                          <input type="hidden" name="horizon_days" value={HORIZON_DAYS} />
                          <input type="hidden" name="runbook_slug" value={workflow.runbookSlug} />
                          {workflow.playbookId ? (
                            <input type="hidden" name="playbook_id" value={workflow.playbookId} />
                          ) : null}
                          <button
                            type="submit"
                            className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20"
                          >
                            Start consolidation play
                          </button>
                        </form>
                      ) : (
                        <form action={updateConsolidationPlayStatusAction} className="flex flex-wrap gap-2">
                          <input type="hidden" name="play_id" value={workflow.play.id} />
                          {(["in_progress", "collected", "verified", "dismissed"] as const).map(
                            (nextStatus) =>
                              nextStatus !== status ? (
                                <button
                                  key={nextStatus}
                                  type="submit"
                                  name="status"
                                  value={nextStatus}
                                  className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
                                >
                                  Mark {nextStatus.replace("_", " ")}
                                </button>
                              ) : null,
                          )}
                        </form>
                      )}
                    </div>
                  ) : null}
                </ConsolePanel>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
