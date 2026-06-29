import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildObligationStaffingActionTrackerPack } from "@/lib/compliance/obligation-staffing-action-tracker";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  acceptStaffingActionAction,
  updateStaffingActionStatusAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Staffing action tracker",
  description:
    "Accept and track load-balance transfers and capacity relief actions through completion.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

const STATUS_STYLE: Record<string, string> = {
  proposed: "text-muted border-white/[0.12]",
  accepted: "text-accent border-accent/30",
  in_progress: "text-amber-200 border-amber-500/30",
  completed: "text-emerald-300 border-emerald-500/30",
  dismissed: "text-muted border-white/[0.08]",
};

export default async function StaffingActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; accepted?: string; updated?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Staffing action tracker"
        description="Sign in to track staffing relief actions."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/staffing-actions");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildObligationStaffingActionTrackerPack(user.id, {
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
        title="Obligation staffing action tracker"
        description="Accept load-balance transfers and capacity what-if relief scenarios, then track them from accepted through in progress to completed."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}
      {typeof sp.accepted === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Staffing action accepted.</p>
      ) : null}
      {typeof sp.updated === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Action status updated.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Staffing tracker unavailable"
          description="Join an organization with load balancing or what-if data to track staffing actions."
          ctas={[
            { href: "/governance/compliance/obligation-load-balancing", label: "Load balancing" },
            { href: "/governance/compliance/obligation-whatif", label: "What-if" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/staffing-actions?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/staffing-actions?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/staffing-completion-rollup"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Completion rollup
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Proposed</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.stats.proposed}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Accepted</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.stats.accepted}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>In progress</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.stats.inProgress}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
              <p className={appOverline}>Completed</p>
              <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>
                {pack.stats.completed}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Peak week</p>
              <p className={`mt-1 text-sm font-semibold text-foreground ${appBody}`}>
                {pack.peakWeekKey ?? "—"}
              </p>
            </div>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>{pack.committeeSummary}</p>

          <ConsolePanel title="Staffing actions">
            <ul className={`space-y-4 ${appBody}`}>
              {pack.items.map((item) => (
                <li
                  key={item.proposal.actionKey}
                  className={`rounded-lg border px-4 py-3 ${STATUS_STYLE[item.status] ?? ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        {item.proposal.actionType.replace(/_/g, " ")} · {item.status}
                      </p>
                      <p className="font-medium text-foreground">{item.proposal.title}</p>
                      <p className={`mt-1 ${appMeta} text-muted`}>{item.proposal.sourceDetail}</p>
                      {item.proposal.fromOwnerLabel && item.proposal.toOwnerLabel ? (
                        <p className={`mt-1 ${appMeta}`}>
                          {item.proposal.fromOwnerLabel} → {item.proposal.toOwnerLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {!readOnly ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.status === "proposed" ? (
                        <form action={acceptStaffingActionAction}>
                          <input type="hidden" name="action_key" value={item.proposal.actionKey} />
                          <input type="hidden" name="horizon_days" value={String(HORIZON_DAYS)} />
                          <button
                            type="submit"
                            className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20"
                          >
                            Accept
                          </button>
                        </form>
                      ) : null}
                      {item.tracked && item.status !== "proposed" ? (
                        <>
                          {item.status === "accepted" ? (
                            <form action={updateStaffingActionStatusAction}>
                              <input type="hidden" name="action_id" value={item.tracked.id} />
                              <input type="hidden" name="status" value="in_progress" />
                              <button
                                type="submit"
                                className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                              >
                                Start
                              </button>
                            </form>
                          ) : null}
                          {item.status === "in_progress" || item.status === "accepted" ? (
                            <form action={updateStaffingActionStatusAction}>
                              <input type="hidden" name="action_id" value={item.tracked.id} />
                              <input type="hidden" name="status" value="completed" />
                              <button
                                type="submit"
                                className="rounded-full border border-emerald-500/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300 hover:bg-emerald-500/10"
                              >
                                Complete
                              </button>
                            </form>
                          ) : null}
                          {item.isOpen ? (
                            <form action={updateStaffingActionStatusAction}>
                              <input type="hidden" name="action_id" value={item.tracked.id} />
                              <input type="hidden" name="status" value="dismissed" />
                              <button
                                type="submit"
                                className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted hover:border-accent/35"
                              >
                                Dismiss
                              </button>
                            </form>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </ConsolePanel>

          <p className={`mt-6 ${appMeta}`}>
            <Link
              href="/governance/compliance/obligation-load-balancing"
              className="text-accent hover:underline"
            >
              Load balancing
            </Link>
            {" · "}
            <Link href="/governance/compliance/obligation-whatif" className="text-accent hover:underline">
              What-if scenarios
            </Link>
            {" · "}
            <Link
              href="/governance/compliance/staffing-action-reminders"
              className="text-accent hover:underline"
            >
              Overdue reminders
            </Link>
            {" · "}
            <Link
              href="/governance/compliance/peak-week-staffing-digest"
              className="text-accent hover:underline"
            >
              Staffing digest
            </Link>
          </p>
        </>
      )}
    </>
  );
}
