import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildStaffingCompletionRollupPack,
  getStaffingCompletionRollupOrgSettings,
  listStaffingCompletionRollupDeliveries,
} from "@/lib/compliance/staffing-completion-rollup";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  deliverStaffingCompletionRollupAction,
  updateStaffingCompletionRollupSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Staffing completion rollup",
  description:
    "Printable HTML or PDF archive of completed vs open staffing actions for committee records.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

export default async function StaffingCompletionRollupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    delivered?: string;
    emails?: string;
    completion?: string;
    saved?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Staffing completion rollup"
        description="Sign in to export staffing completion archives."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/staffing-completion-rollup");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildStaffingCompletionRollupPack(user.id, {
        orgId: orgContext.orgId,
        orgName: orgContext.orgName ?? undefined,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  const settings = orgContext.orgId
    ? await getStaffingCompletionRollupOrgSettings(orgContext.orgId, supabase)
    : null;

  const deliveries = orgContext.orgId
    ? await listStaffingCompletionRollupDeliveries(orgContext.orgId, { supabase })
    : [];

  const err = typeof sp.error === "string" ? sp.error : undefined;
  const htmlUrl = `/api/governance/compliance/staffing-completion-rollup?horizonDays=${HORIZON_DAYS}&format=html`;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Staffing completion rollup"
        description="Committee archive of tracked staffing actions — open vs completed, completion rate, and printable HTML you can save as PDF."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {typeof sp.delivered === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>
          Rollup emailed — {sp.emails ?? "0"} recipient(s), {sp.completion ?? "0"}% completion.
        </p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Settings saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Completion rollup unavailable"
          description="Join an organization with staffing actions to build the completion archive."
          ctas={[
            { href: "/governance/compliance/staffing-actions", label: "Staffing actions" },
            { href: "/governance/compliance/staffing-action-reminders", label: "Overdue reminders" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20"
            >
              Open printable HTML
            </a>
            <a
              href={`/api/governance/compliance/staffing-completion-rollup?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/staffing-completion-rollup?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Tracked</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.trackedCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Completed</p>
              <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>
                {pack.completedCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Open</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.openCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Completion</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.completionPercent}%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Last email</p>
              <p className={`mt-1 text-sm font-semibold text-foreground ${appBody}`}>
                {pack.lastDeliveryAt?.slice(0, 10) ?? "Never"}
              </p>
            </div>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>{pack.committeeSummary}</p>

          {canEdit && !readOnly ? (
            <ConsolePanel title="Scheduled delivery">
              <form
                action={updateStaffingCompletionRollupSettingsAction}
                className={`space-y-4 ${appBody}`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="rollup_enabled"
                    defaultChecked={settings?.rollupEnabled}
                    className="rounded border-border"
                  />
                  <span>Enable completion rollup delivery</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="email_enabled"
                    defaultChecked={settings?.emailEnabled}
                    className="rounded border-border"
                  />
                  <span>Email owners and admins weekly (deduped per UTC week)</span>
                </label>
                <button
                  type="submit"
                  className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                >
                  Save settings
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={deliverStaffingCompletionRollupAction}>
                  <button
                    type="submit"
                    disabled={pack.trackedCount === 0}
                    className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:bg-accent/20 disabled:opacity-40"
                  >
                    Email rollup now
                  </button>
                </form>
                {pack.trackedCount > 0 ? (
                  <form action={deliverStaffingCompletionRollupAction}>
                    <input type="hidden" name="force" value="1" />
                    <button
                      type="submit"
                      className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                    >
                      Force resend this week
                    </button>
                  </form>
                ) : null}
              </div>
              <p className={`mt-3 ${appMeta} text-muted`}>
                Cron:{" "}
                <code className="text-foreground/80">
                  ZENTRO_STAFFING_COMPLETION_ROLLUP_CRON_SECRET
                </code>
                {" · "}
                Use browser Print → Save as PDF on the printable HTML link.
              </p>
            </ConsolePanel>
          ) : null}

          {deliveries.length > 0 ? (
            <div className="mt-6">
              <ConsolePanel title="Delivery log">
                <ul className={`space-y-2 ${appMeta}`}>
                  {deliveries.map((row) => (
                    <li key={row.id} className="rounded-lg border border-white/[0.06] px-3 py-2">
                      <span className="font-mono text-xs text-muted">
                        {row.createdAt.slice(0, 19)}
                      </span>
                      {" · "}
                      {row.completionPercent}% · {row.completedCount}/{row.trackedCount} completed
                      {" · "}
                      {row.emailsSent} email(s)
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}

          <p className={`mt-6 ${appMeta}`}>
            <Link
              href="/governance/compliance/staffing-actions"
              className="text-accent hover:underline"
            >
              Staffing actions
            </Link>
            {" · "}
            <Link
              href="/governance/compliance/staffing-action-reminders"
              className="text-accent hover:underline"
            >
              Overdue reminders
            </Link>
          </p>
        </>
      )}
    </>
  );
}
