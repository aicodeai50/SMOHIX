import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { PLAYBOOKS } from "@/lib/automations/playbooks";
import {
  buildComplianceGapRunbookQueue,
  frameworkLabel,
} from "@/lib/compliance/gap-remediation";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { trackGapRunbookAction, updateGapRunbookStatusAction } from "./actions";

export const metadata: Metadata = {
  title: "Compliance gap runbooks",
  description: "Link framework assessment gaps to remediation runbooks and automation playbooks.",
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  open: "text-warning",
  in_progress: "text-accent",
  resolved: "text-emerald-300",
  dismissed: "text-muted",
};

export default async function ComplianceGapRunbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tracked?: string; updated?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Compliance gap runbooks"
          description="Sign in to track remediation for framework assessment gaps."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/runbooks");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const queue = orgContext.orgId
    ? await buildComplianceGapRunbookQueue(user.id, orgContext.orgId, { supabase })
    : null;

  const err = typeof sp.error === "string" ? sp.error : undefined;

  if (!orgContext.orgId || !queue) {
    return (
      <>
        <PageHeader title="Compliance gap runbooks" description="Gap-to-runbook remediation tracking." />
        <ConsoleEmptyState
          title="Runbooks unavailable"
          description="Join an organization to link live assessment gaps to remediation runbooks."
          ctas={[{ href: "/governance/compliance/program", label: "Program dashboard" }]}
        />
      </>
    );
  }

  const openCount = queue.gaps.filter(
    (g) => !g.remediation || g.remediation.status === "open" || g.remediation.status === "in_progress",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance automation runbooks"
        description="Live framework gaps from continuous assessment, mapped to in-repo runbooks and guarded automation playbooks. Track closure on the program dashboard."
      />
      <ComplianceHubLinks />

      {err ? (
        <p className={`mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 ${appMeta} text-danger`}>
          {err}
        </p>
      ) : null}
      {sp.tracked === "1" ? (
        <p className={`mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 ${appMeta} text-emerald-300`}>
          Gap linked to runbook — track progress below or on the program dashboard.
        </p>
      ) : null}
      {sp.updated === "1" ? (
        <p className={`mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 ${appMeta} text-emerald-300`}>
          Remediation status updated.
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Gaps in queue</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{queue.gaps.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Open / in progress</p>
          <p className={`mt-1 text-2xl font-semibold text-warning ${appBody}`}>{openCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Resolved</p>
          <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>
            {queue.stats.resolved}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Program rollup</p>
          <Link href="/governance/compliance/program" className={`mt-2 inline-flex text-sm text-accent hover:underline ${appBody}`}>
            View dashboard
          </Link>
        </div>
      </div>

      <ConsolePanel title="Gap remediation queue">
        {queue.gaps.length === 0 ? (
          <ConsoleEmptyState
            title="No gaps in window"
            description="Assessment reports show no exceptions in the current period. Check framework packs or widen the monitoring window on the program dashboard."
          />
        ) : (
          <ul className={`space-y-4 ${appBody}`}>
            {queue.gaps.map((item) => (
              <li
                key={item.gapKey}
                className="rounded-lg border border-white/[0.08] px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-accent">
                      {frameworkLabel(item.framework)} · {item.controlRef}
                    </p>
                    <p className="text-foreground">{item.title}</p>
                    <p className={`mt-1 ${appMeta} text-muted`}>{item.reason}</p>
                  </div>
                  {item.remediation ? (
                    <span
                      className={`rounded-full border border-white/[0.12] px-2 py-0.5 text-[11px] font-semibold uppercase ${STATUS_STYLE[item.remediation.status] ?? ""}`}
                    >
                      {item.remediation.status.replace("_", " ")}
                    </span>
                  ) : (
                    <span className={`${appMeta} text-muted`}>Not tracked</span>
                  )}
                </div>

                <p className={`mt-3 ${appMeta} text-muted`}>
                  Suggested:{" "}
                  <Link href={`/runbooks/${item.suggestion.runbookSlug}`} className="text-accent hover:underline">
                    {item.suggestion.runbookTitle}
                  </Link>
                  {item.suggestion.playbookName ? (
                    <>
                      {" "}
                      · Playbook {item.suggestion.playbookName} (
                      <Link href="/automations" className="text-accent hover:underline">
                        automations
                      </Link>
                      )
                    </>
                  ) : null}
                  <span className="block mt-1">{item.suggestion.rationale}</span>
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!item.remediation ? (
                    <form action={trackGapRunbookAction}>
                      <input type="hidden" name="framework" value={item.framework} />
                      <input type="hidden" name="control_ref" value={item.controlRef} />
                      <input type="hidden" name="title" value={item.title} />
                      <input type="hidden" name="reason" value={item.reason} />
                      <input type="hidden" name="runbook_slug" value={item.suggestion.runbookSlug} />
                      {item.suggestion.playbookId ? (
                        <input type="hidden" name="playbook_id" value={item.suggestion.playbookId} />
                      ) : null}
                      <button
                        type="submit"
                        className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20"
                      >
                        Track remediation
                      </button>
                    </form>
                  ) : (
                    <>
                      <Link
                        href={`/runbooks/${item.remediation.runbookSlug}`}
                        className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/80 hover:border-accent/35"
                      >
                        Open runbook
                      </Link>
                      {item.remediation.status !== "resolved" ? (
                        <form action={updateGapRunbookStatusAction} className="inline">
                          <input type="hidden" name="remediation_id" value={item.remediation.id} />
                          <input type="hidden" name="status" value="in_progress" />
                          <button
                            type="submit"
                            className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/80 hover:border-accent/35"
                          >
                            In progress
                          </button>
                        </form>
                      ) : null}
                      {item.remediation.status !== "resolved" ? (
                        <form action={updateGapRunbookStatusAction} className="inline">
                          <input type="hidden" name="remediation_id" value={item.remediation.id} />
                          <input type="hidden" name="status" value="resolved" />
                          <button
                            type="submit"
                            className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300"
                          >
                            Mark resolved
                          </button>
                        </form>
                      ) : null}
                      {item.remediation.status !== "dismissed" ? (
                        <form action={updateGapRunbookStatusAction} className="inline">
                          <input type="hidden" name="remediation_id" value={item.remediation.id} />
                          <input type="hidden" name="status" value="dismissed" />
                          <button
                            type="submit"
                            className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted hover:text-foreground"
                          >
                            Dismiss
                          </button>
                        </form>
                      ) : null}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ConsolePanel>

      <div className="mt-6">
      <ConsolePanel title="Automation playbooks">
        <ul className={`space-y-2 ${appMeta}`}>
          {PLAYBOOKS.map((p) => (
            <li key={p.id}>
              <span className="font-mono text-accent">{p.id}</span> — {p.name} ({p.env}, {p.risk} risk)
            </li>
          ))}
        </ul>
        <p className={`mt-3 ${appMeta} text-muted`}>
          Run guarded playbooks from{" "}
          <Link href="/automations" className="text-accent hover:underline">
            Automations
          </Link>{" "}
          after dry-run; audit events feed compliance evidence.
        </p>
      </ConsolePanel>
      </div>
    </>
  );
}
