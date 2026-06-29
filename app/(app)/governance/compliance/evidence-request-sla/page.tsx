import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildEvidenceRequestSlaDashboardPack } from "@/lib/compliance/evidence-request-sla-dashboard";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { deliverEvidenceRequestSlaDigestAction } from "./actions";

export const metadata: Metadata = {
  title: "Evidence request SLA",
  description: "Assessor evidence request fulfillment SLAs, overdue queue, and auditor digest.",
};

export const dynamic = "force-dynamic";

export default async function EvidenceRequestSlaPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    delivered?: string;
    emails?: string;
    webhook?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Evidence request SLA"
        description="Sign in to view assessor evidence request SLA metrics."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/evidence-request-sla");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;
  const canDeliver =
    orgContext.role &&
    (canManageMembers(orgContext.role) || isReadOnlyAuditorRole(orgContext.role));

  const pack = orgContext.orgId
    ? await buildEvidenceRequestSlaDashboardPack(user.id, { orgId: orgContext.orgId, supabase })
    : null;

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance evidence request SLA dashboard"
        description="Fulfillment SLAs for assessor document requests — overdue queue, at-risk window, assignee and framework rollups, and deliverable auditor digest (email + webhook)."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="SLA dashboard unavailable"
          description="Join an organization with assessor evidence requests to view fulfillment SLAs."
          ctas={[
            { href: "/governance/compliance/evidence-requests", label: "Evidence requests" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/evidence-request-sla?format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/evidence-request-sla?format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            {canDeliver ? (
              <form action={deliverEvidenceRequestSlaDigestAction}>
                <button
                  type="submit"
                  className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:border-accent/60"
                >
                  Deliver auditor digest
                </button>
              </form>
            ) : null}
            <Link
              href="/governance/compliance/evidence-requests"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Evidence requests
            </Link>
          </div>

          {err ? (
            <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p>
          ) : null}
          {sp.delivered === "1" ? (
            <p className={`mb-4 ${appMeta} text-emerald-300`}>
              Auditor digest delivered — {sp.emails ?? "0"} email(s)
              {sp.webhook === "1" ? ", webhook sent" : ""}.
            </p>
          ) : null}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {pack.overdueCount}
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className={appOverline}>At risk ({pack.atRiskDays}d)</p>
              <p className={`mt-1 text-2xl font-semibold text-amber-200 ${appBody}`}>
                {pack.atRiskCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Open</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.openCount}
              </p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>On-time %</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {pack.onTimeFulfillmentPercent}%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Fulfillment rate</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.fulfillmentRatePercent}%
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <ConsolePanel title="Overdue queue">
              {pack.overdueQueue.length === 0 ? (
                <p className={appMeta}>No overdue assessor evidence requests.</p>
              ) : (
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.overdueQueue.slice(0, 12).map((item) => (
                    <li key={item.requestId}>
                      <span className="text-danger">{item.daysOverdue}d overdue</span> ·{" "}
                      {item.frameworkLabel} {item.controlRef} — {item.title}
                      {item.assignedToLabel ? (
                        <span className={appMeta}> · {item.assignedToLabel}</span>
                      ) : (
                        <span className={`${appMeta} text-warning`}> · unassigned</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </ConsolePanel>

            <ConsolePanel title="At-risk queue">
              {pack.atRiskQueue.length === 0 ? (
                <p className={appMeta}>No requests in the at-risk window.</p>
              ) : (
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.atRiskQueue.slice(0, 12).map((item) => (
                    <li key={item.requestId}>
                      Due in {item.daysUntilDue}d · {item.controlRef} — {item.title}
                    </li>
                  ))}
                </ul>
              )}
            </ConsolePanel>
          </div>

          {pack.assigneeSummaries.length > 0 ? (
            <div className="mb-6">
              <ConsolePanel title="Assignee SLA rollup">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.assigneeSummaries.slice(0, 10).map((a) => (
                    <li key={a.assigneeUserId ?? "unassigned"}>
                      {a.assigneeLabel}: {a.openCount} open
                      {a.overdueCount > 0 ? (
                        <span className="text-danger"> ({a.overdueCount} overdue)</span>
                      ) : null}
                      {a.fulfilledCount > 0 ? (
                        <span className={appMeta}> · {a.onTimeRatePercent}% on-time</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}

          <ConsolePanel title="Auditor digest preview">
            <pre className={`max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted ${appMeta}`}>
              {pack.auditorDigestPreview}
            </pre>
          </ConsolePanel>
        </>
      )}
    </>
  );
}
