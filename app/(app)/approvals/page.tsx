import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { approvalDecisionAction, createApprovalRequestAction } from "./actions";
import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { ExecutionBadge } from "@/components/guardrails/ExecutionBadge";
import { ExecutionModeCallout } from "@/components/guardrails/ExecutionModeCallout";
import { GuardedAutomationIdentity } from "@/components/guardrails/GuardedAutomationIdentity";
import { listApprovalsForUser } from "@/lib/approvals/data";
import { listAcceptedPolicyGuardrailsByPlaybook } from "@/lib/approvals/policy-suggestions";
import { getOrgContextForUser } from "@/lib/org/context";
import { roleLabel } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { appBody, appLabel, appMeta, appOverline, appPanelTitle } from "@/lib/app-typography";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getIncidentForUser } from "@/lib/incidents/data";
import {
  formatPolicyHintForDisplay,
  incidentHref,
  isIncidentUuid,
} from "@/lib/workflow/incident-links";

export const metadata: Metadata = {
  title: "Approvals",
  description: "Pending and recent approval decisions.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    created?: string;
    incident?: string;
  }>;
};

export default async function ApprovalsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const errQ = typeof sp.error === "string" ? sp.error : undefined;
  const msgQ = typeof sp.message === "string" ? sp.message : undefined;
  const createdOk = sp.created === "1";
  const incidentParam = typeof sp.incident === "string" ? sp.incident.trim() : "";
  const linkedIncidentId = isIncidentUuid(incidentParam) ? incidentParam.toLowerCase() : null;

  let userId = "";
  let devTenantId: string | null = null;
  let supabaseClient: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;

  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    supabaseClient = supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/approvals");
    }
    userId = user.id;
  } else {
    devTenantId = ((await cookies()).get("smohix_dev_tid")?.value ?? (await cookies()).get("zentro_dev_tid")?.value) ?? null;
  }

  const orgContext = hasSupabaseAuth() && userId ? await getOrgContextForUser(userId) : null;

  const { source, pending, recent } = await listApprovalsForUser({
    userId: userId || "local",
    devTenantId,
    orgId: orgContext?.orgId ?? null,
    orgRole: orgContext?.role ?? null,
  });
  const pendingMissingChecks = pending.filter((p) =>
    p.decisionBrief.policyChecks.some((check) => !check.passed),
  ).length;
  const pendingHighRisk = pending.filter((p) => p.decisionBrief.riskScore >= 70).length;
  let enforcedPlaybookCount = 0;
  if (supabaseClient && userId) {
    const acceptedGuardrails = await listAcceptedPolicyGuardrailsByPlaybook(supabaseClient, userId);
    enforcedPlaybookCount = Object.keys(acceptedGuardrails).length;
  }

  const ambient = await loadConsoleAmbientSnapshot({ context: "approvals" });

  let linkedIncidentTitle: string | null = null;
  if (linkedIncidentId && userId && hasSupabaseAuth()) {
    const resolved = await getIncidentForUser(
      userId,
      linkedIncidentId,
      null,
      orgContext?.orgId ?? null,
    );
    linkedIncidentTitle = resolved?.row.title ?? null;
  }

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Human approval controls for high-impact changes. Submit requests, decide pending items, and track completed outcomes."
      />
      <ConsoleAmbientBanner snapshot={ambient} />
      {linkedIncidentId ? (
        <p className={`mb-4 rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-accent ${appBody}`}>
          Linked to this incident
          {linkedIncidentTitle ? (
            <>
              : <span className="font-semibold text-foreground">{linkedIncidentTitle}</span>
            </>
          ) : null}
          .{" "}
          <Link
            href={incidentHref(linkedIncidentId)}
            className="font-semibold underline-offset-2 hover:underline"
          >
            Open incident →
          </Link>{" "}
          New requests stay connected so reviewers can return to the same workspace.
        </p>
      ) : null}
      {orgContext?.orgId ? (
        <p className={`-mt-4 mb-4 ${appMeta}`}>
          Organization: <span className="text-foreground/90">{orgContext.orgName}</span>
          {orgContext.role ? ` · ${roleLabel(orgContext.role)}` : ""}
          {" · "}
          <Link href="/settings/members" className="text-accent hover:underline">
            Members
          </Link>
        </p>
      ) : hasSupabaseAuth() ? (
        <p className={`-mt-4 mb-4 ${appMeta}`}>
          Personal workspace.{" "}
          <Link href="/settings/members" className="text-accent hover:underline">
            Create an organization
          </Link>{" "}
          for delegated approvers.
        </p>
      ) : null}
      <p className={`mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 ${appMeta}`}>
        Policy baseline: high-risk requests must explicitly declare both{" "}
        <span className="font-mono text-foreground/85">two-person approval</span> and a{" "}
        <span className="font-mono text-foreground/85">change window</span> in the policy note.
      </p>
      <div className="mb-6 space-y-4">
        <GuardedAutomationIdentity />
        <ExecutionModeCallout
          requiresApproval
          dryRunAvailable
          auditLogged={hasSupabaseAuth()}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className={appMeta}>Pending approvals</p>
            <p className={`mt-1 ${appBody} font-semibold text-foreground`}>{pending.length}</p>
            <p className={appMeta}>{pendingMissingChecks} missing one or more required controls</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className={appMeta}>High-risk pending</p>
            <p className={`mt-1 ${appBody} font-semibold text-foreground`}>{pendingHighRisk}</p>
            <p className={appMeta}>Risk score 70+ awaiting decision</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className={appMeta}>Enforced playbooks</p>
            <p className={`mt-1 ${appBody} font-semibold text-foreground`}>{enforcedPlaybookCount}</p>
            <p className={appMeta}>Accepted policies actively enforced at execution time</p>
          </div>
        </div>
      </div>
      {createdOk ? (
        <p className={`mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-emerald-100/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm ${appBody}`}>
          Approval request created and queued for decision.
        </p>
      ) : null}
      {errQ ? (
        <p className={`mb-4 rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-red-200/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm ${appMeta}`}>
          {errQ === "no_session" && "Reload the page so a browser session cookie is set."}
          {errQ === "not_found" && "That approval is no longer pending."}
          {errQ === "update_failed" && "Could not update (check you own this row and it is still pending)."}
          {errQ === "rbac" && (msgQ ?? "Your org role cannot perform that action.")}
          {errQ === "self_approval" && "Delegated approvers cannot approve their own request."}
          {errQ === "create" && (msgQ ?? "Could not create the request.")}
        </p>
      ) : null}
      {source === "session" ? (
        <p className={`smohix-glass-subtle mb-4 rounded-xl px-4 py-3 ${appMeta}`}>
          Approvals are scoped to this browser session. Sign in to a configured workspace for a
          shared, persistent approval queue.
        </p>
      ) : hasSupabaseAuth() && pending.length === 0 && recent.length === 0 ? (
        <p className={`smohix-glass-subtle mb-4 rounded-xl px-4 py-3 ${appMeta}`}>
          No approval requests yet. Submit one below, or start from an incident with{" "}
          <span className="text-foreground/85">Request approval</span>.
        </p>
      ) : null}
      <section className="smohix-glass mb-6 rounded-2xl p-5 md:p-6">
        <h2 className={`${appPanelTitle} text-foreground/95`}>New approval request</h2>
        <p className={`mt-1 ${appMeta}`}>
          Describe the change. Optional fields help reviewers apply the right policy.
        </p>
        <form action={createApprovalRequestAction} className="mt-4 max-w-2xl space-y-4">
          {linkedIncidentId ? (
            <input type="hidden" name="incident_id" value={linkedIncidentId} />
          ) : null}
          <div>
            <label htmlFor="action_label" className={`mb-1.5 block ${appLabel}`}>
              Action <span className="text-red-400/90">*</span>
            </label>
            <input
              id="action_label"
              name="action_label"
              required
              maxLength={500}
              placeholder="e.g. Promote canary to production — svc/checkout"
              defaultValue={
                linkedIncidentId
                  ? linkedIncidentTitle
                    ? `Guarded change: ${linkedIncidentTitle}`
                    : "Guarded change for linked incident"
                  : undefined
              }
              className={`h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-foreground outline-none ring-accent/25 transition-[border-color,box-shadow] focus:border-accent/40 focus:ring-2 ${appBody}`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="requested_by" className={`mb-1.5 block ${appLabel}`}>
                Requested by
              </label>
              <input
                id="requested_by"
                name="requested_by"
                maxLength={200}
                placeholder="Team or username"
                className={`h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-foreground outline-none ring-accent/25 transition-[border-color,box-shadow] focus:border-accent/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="policy_hint" className={`mb-1.5 block ${appLabel}`}>
                Policy / risk note
              </label>
              <input
                id="policy_hint"
                name="policy_hint"
                maxLength={500}
                placeholder="e.g. Two-person rule, change window only"
                className={`h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-foreground outline-none ring-accent/25 transition-[border-color,box-shadow] focus:border-accent/40 focus:ring-2 ${appBody}`}
              />
            </div>
          </div>
          <button
            type="submit"
            className={`inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)] ${appBody}`}
          >
            Submit request
          </button>
        </form>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-amber-400/15 bg-amber-500/[0.06] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md md:p-6">
          <h2 className={`${appOverline} text-amber-200/90`}>Pending</h2>
          {pending.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="Nothing awaiting approval"
                description="When operators request a high-impact change, pending items appear here for human decision."
                ctas={[{ href: "#action_label", label: "New request", variant: "secondary" }]}
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-[border-color,box-shadow] hover:border-amber-400/20 hover:shadow-[0_0_24px_-14px_rgba(251,191,36,0.15)]"
                >
                  <p className={`font-mono ${appMeta}`}>{p.id}</p>
                  <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                    <p className={`min-w-0 font-medium text-foreground ${appBody}`}>{p.action}</p>
                    <ExecutionBadge tone="warn" title="Waiting for a human decision">
                      Pending approval
                    </ExecutionBadge>
                  </div>
                  <p className={`mt-1 ${appMeta}`}>
                    {p.requestedBy} · {formatPolicyHintForDisplay(p.policy)}
                  </p>
                  {p.linkedIncidentId ? (
                      <p className={`mt-2 ${appMeta}`}>
                        Linked incident:{" "}
                        <Link
                          href={incidentHref(p.linkedIncidentId)}
                          className="font-medium text-accent hover:underline"
                        >
                          Open incident →
                        </Link>
                      </p>
                  ) : null}
                  <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border border-white/[0.12] px-2 py-0.5 ${appMeta}`}>
                        Risk: {p.decisionBrief.riskScore}
                      </span>
                      <span className={`rounded-full border border-white/[0.12] px-2 py-0.5 ${appMeta}`}>
                        Confidence: {p.decisionBrief.confidenceScore}
                      </span>
                      <span className={`rounded-full border border-white/[0.12] px-2 py-0.5 ${appMeta}`}>
                        Blast radius: {p.decisionBrief.blastRadius}
                      </span>
                    </div>
                    <p className={`mt-2 ${appMeta}`}>Policy checks</p>
                    <ul className="mt-1 space-y-1">
                      {p.decisionBrief.policyChecks.map((check) => (
                        <li key={check.label} className={`flex items-start gap-2 ${appMeta}`}>
                          <span
                            className={
                              check.passed ? "mt-0.5 text-emerald-300" : "mt-0.5 text-amber-300"
                            }
                            aria-hidden
                          >
                            {check.passed ? "●" : "○"}
                          </span>
                          <span>
                            <span className="text-foreground/90">{check.label}</span> — {check.note}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {p.canDecide ? (
                      <>
                        <form action={approvalDecisionAction} className="flex-1">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <button
                            type="submit"
                            className={`w-full rounded-md bg-emerald-600/90 py-2 font-medium text-white transition-opacity hover:opacity-90 ${appMeta}`}
                          >
                            Approve
                          </button>
                        </form>
                        <form action={approvalDecisionAction} className="flex-1">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="decision" value="denied" />
                          <button
                            type="submit"
                            className={`w-full rounded-lg border border-white/[0.1] bg-white/[0.02] py-2 font-medium text-foreground transition-[border-color,color] hover:border-red-400/35 hover:text-red-200 ${appMeta}`}
                          >
                            Deny
                          </button>
                        </form>
                      </>
                    ) : (
                      <p className={`w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-muted ${appMeta}`}>
                        {p.decideBlockedReason ?? "You cannot decide this request."}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="smohix-glass rounded-2xl p-5 md:p-6">
          <h2 className={`${appPanelTitle} text-muted`}>Recent</h2>
          {recent.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No completed decisions yet"
                description="Approved or denied items land here after you act on pending requests."
                ctas={[
                  {
                    href: "/settings",
                    label: "Settings",
                    variant: "secondary",
                  },
                ]}
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`${appBody} text-foreground/90`}>{r.action}</span>
                    {r.status === "approved" ? (
                      <ExecutionBadge tone="success" title="Recorded in audit when Supabase append is enabled">
                        Approved
                      </ExecutionBadge>
                    ) : (
                      <ExecutionBadge tone="danger" title="Blocked path — revisit policy or open a new request">
                        Denied
                      </ExecutionBadge>
                    )}
                  </div>
                  <p className={`mt-1 font-mono ${appMeta}`}>{r.id}</p>
                <p className={`${appMeta}`}>
                  Risk {r.decisionBrief.riskScore} · Confidence {r.decisionBrief.confidenceScore} ·{" "}
                  {r.decisionBrief.blastRadius}
                </p>
                {r.linkedIncidentId ? (
                    <p className={`mt-1 ${appMeta}`}>
                      <Link
                        href={incidentHref(r.linkedIncidentId)}
                        className="font-medium text-accent hover:underline"
                      >
                        Open linked incident →
                      </Link>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
