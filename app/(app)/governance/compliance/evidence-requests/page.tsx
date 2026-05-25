import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildAssessorEvidenceRequestPack,
  documentTypeLabel,
  EVIDENCE_DOCUMENT_TYPES,
  EVIDENCE_REQUEST_CONTROL_OPTIONS,
  frameworkConsolePath,
} from "@/lib/compliance/assessor-evidence-requests";
import type { EvidenceRequestWorkflowStatus } from "@/lib/compliance/assessor-evidence-requests";
import {
  cancelEvidenceRequestAction,
  createEvidenceRequestAction,
  fulfillEvidenceRequestAction,
} from "./actions";
import { getOrgContextForUser } from "@/lib/org/context";
import { listOrgMembers } from "@/lib/org/data";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Assessor evidence requests",
  description: "Track open document requests from auditors with due dates and control linkage.",
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<EvidenceRequestWorkflowStatus, string> = {
  open: "text-warning",
  overdue: "text-danger",
  fulfilled: "text-emerald-300",
  cancelled: "text-muted",
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EvidenceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; fulfilled?: string; cancelled?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Assessor evidence requests"
        description="Sign in to manage assessor evidence requests."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/evidence-requests");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const readOnlyAuditor = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;
  const isAuditor = orgContext.role ? isReadOnlyAuditorRole(orgContext.role) : false;
  const canCreate =
    orgContext.role &&
    (isReadOnlyAuditorRole(orgContext.role) || canManageMembers(orgContext.role));
  const canFulfill = orgContext.role && !isReadOnlyAuditorRole(orgContext.role);

  if (!orgContext.orgId) {
    return (
      <>
        <PageHeader title="Assessor evidence requests" description="Auditor document request workflow." />
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization to track assessor evidence requests."
          ctas={[{ href: "/settings/members", label: "Members" }]}
        />
      </>
    );
  }

  const [pack, members] = await Promise.all([
    buildAssessorEvidenceRequestPack(user.id, { orgId: orgContext.orgId, supabase }),
    listOrgMembers(orgContext.orgId),
  ]);

  const openRequests = pack?.requests.filter((r) => r.status === "open" || r.status === "overdue") ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Assessor evidence request workflow"
        description="Auditors and admins open document requests tied to catalog controls with due dates; operators fulfill requests and link to live audit evidence."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnlyAuditor ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {sp.error ? (
        <p className={`mb-4 ${appMeta} text-danger`}>Action failed ({sp.error}).</p>
      ) : null}
      {sp.created ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Evidence request created.</p>
      ) : null}
      {sp.fulfilled ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Request marked fulfilled.</p>
      ) : null}
      {sp.cancelled ? (
        <p className={`mb-4 ${appMeta} text-muted`}>Request cancelled.</p>
      ) : null}

      {!pack ? (
        <ConsoleEmptyState
          title="Evidence requests unavailable"
          description="Could not load the evidence request register."
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/evidence-requests?format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/evidence-requests?format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/workbook"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Assessor workbook
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Open</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.openCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.overdueCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Fulfilled</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.fulfilledCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Total</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.totalCount}</p>
            </div>
          </div>

          {canCreate ? (
            <div className="mb-6">
              <PlaceholderCard title="New evidence request">
                <form action={createEvidenceRequestAction} className={`space-y-4 ${appBody}`}>
                  <div>
                    <label className={appLabel} htmlFor="controlId">
                      Control
                    </label>
                    <select
                      id="controlId"
                      name="controlId"
                      required
                      className="mt-1 w-full max-w-xl rounded-lg border border-white/[0.12] bg-surface/60 px-3 py-2 text-sm"
                    >
                      <option value="">Select control…</option>
                      {EVIDENCE_REQUEST_CONTROL_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={appLabel} htmlFor="title">
                      Request title
                    </label>
                    <input
                      id="title"
                      name="title"
                      required
                      className="mt-1 w-full max-w-xl rounded-lg border border-white/[0.12] bg-surface/60 px-3 py-2 text-sm"
                      placeholder="e.g. CC6.1 logical access review export"
                    />
                  </div>
                  <div>
                    <label className={appLabel} htmlFor="documentType">
                      Document type
                    </label>
                    <select
                      id="documentType"
                      name="documentType"
                      className="mt-1 w-full max-w-md rounded-lg border border-white/[0.12] bg-surface/60 px-3 py-2 text-sm"
                    >
                      {EVIDENCE_DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {documentTypeLabel(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={appLabel} htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      className="mt-1 w-full max-w-xl rounded-lg border border-white/[0.12] bg-surface/60 px-3 py-2 text-sm"
                      placeholder="What the assessor needs to review…"
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <label className={appLabel} htmlFor="assignedToUserId">
                        Assign to
                      </label>
                      <select
                        id="assignedToUserId"
                        name="assignedToUserId"
                        className="mt-1 rounded-lg border border-white/[0.12] bg-surface/60 px-3 py-2 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {members
                          .filter((m) => m.role !== "auditor" && m.role !== "viewer")
                          .map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.displayName ?? m.email ?? m.userId.slice(0, 8)} ({m.role})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className={appLabel} htmlFor="dueAt">
                        Due
                      </label>
                      <input
                        id="dueAt"
                        name="dueAt"
                        type="datetime-local"
                        className="mt-1 rounded-lg border border-white/[0.12] bg-surface/60 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full border border-accent/40 bg-accent/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-accent/25"
                  >
                    Create request
                  </button>
                </form>
              </PlaceholderCard>
            </div>
          ) : null}

          <PlaceholderCard title="Open requests">
            {openRequests.length === 0 ? (
              <p className={appMeta}>No open or overdue evidence requests.</p>
            ) : (
              <ul className={`space-y-4 ${appBody}`}>
                {openRequests.map((req) => (
                  <li
                    key={req.id}
                    className="rounded-xl border border-white/[0.08] bg-surface/30 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {req.title}{" "}
                          <span className={`${appMeta} ${STATUS_STYLE[req.status]}`}>({req.status})</span>
                        </p>
                        <p className={appMeta}>
                          <Link href={frameworkConsolePath(req.framework)} className="text-accent hover:underline">
                            {req.frameworkLabel} {req.controlRef}
                          </Link>
                          {" · "}
                          {req.controlTitle}
                        </p>
                        <p className={appMeta}>
                          {documentTypeLabel(req.documentType)} · due {req.dueAt.slice(0, 10)} · requested by{" "}
                          {req.requestedByLabel}
                          {req.assignedToLabel ? ` · assigned ${req.assignedToLabel}` : ""}
                        </p>
                        {req.description ? <p className={`mt-1 ${appMeta} text-muted`}>{req.description}</p> : null}
                      </div>
                      <Link
                        href={req.auditEvidenceHref}
                        className="text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                      >
                        Audit evidence
                      </Link>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canFulfill ? (
                        <form action={fulfillEvidenceRequestAction} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="requestId" value={req.id} />
                          <input
                            name="note"
                            placeholder="Fulfillment note"
                            className="rounded-lg border border-white/[0.12] bg-surface/60 px-2 py-1 text-sm"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-emerald-500/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200 hover:bg-emerald-500/10"
                          >
                            Mark fulfilled
                          </button>
                        </form>
                      ) : null}
                      {(isAuditor || (orgContext.role && canManageMembers(orgContext.role))) &&
                      req.status !== "fulfilled" ? (
                        <form action={cancelEvidenceRequestAction}>
                          <input type="hidden" name="requestId" value={req.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-white/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted hover:border-white/25"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PlaceholderCard>

          {pack.requests.filter((r) => r.status === "fulfilled" || r.status === "cancelled").length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Closed requests">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.requests
                    .filter((r) => r.status === "fulfilled" || r.status === "cancelled")
                    .slice(0, 15)
                    .map((req) => (
                      <li key={req.id} className="border-b border-white/[0.06] pb-2 last:border-0">
                        <span className={STATUS_STYLE[req.status]}>{req.status}</span> — {req.title} (
                        {req.frameworkLabel} {req.controlRef})
                        {req.fulfilledAt ? (
                          <span className={appMeta}> · fulfilled {req.fulfilledAt.slice(0, 10)}</span>
                        ) : null}
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
