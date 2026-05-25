import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildPolicyDriftPack } from "@/lib/compliance/policy-drift";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Policy drift detection",
  description: "Accepted automation policies whose guardrails diverge from live assessment gaps.",
};

export const dynamic = "force-dynamic";

const SEVERITY_STYLE: Record<string, string> = {
  high: "text-danger border-danger/40 bg-danger/10",
  medium: "text-warning border-warning/35 bg-warning/10",
  low: "text-muted border-white/[0.12] bg-white/[0.04]",
};

export default async function PolicyDriftPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Policy drift"
          description="Sign in to detect guardrail drift on accepted automation policies."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/policy-drift");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildPolicyDriftPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance policy drift detection"
        description="Compare accepted automation policy guardrails against live continuous assessment gaps from your org audit_log and policy_suggestions — surfaces missing dry-run, change-window, and blast-radius enforcement."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Drift detection unavailable"
          description="Join an organization and accept automation policies to compare guardrails against assessment gaps."
          ctas={[
            { href: "/governance/policies", label: "Policy review" },
            { href: "/governance/compliance/program", label: "Program dashboard" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/policy-drift?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/policy-drift?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/policies"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Policy review
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Accepted policies</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.acceptedPolicyCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Assessment gaps</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.assessmentGapCount}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>{pack.periodDays}d window</p>
            </div>
            <div className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3">
              <p className={appOverline}>High drift</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>{pack.highCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Medium / low</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.mediumCount} / {pack.lowCount}
              </p>
            </div>
          </div>

          <PlaceholderCard title="Drift findings">
            {pack.findings.length === 0 ? (
              <p className={`${appMeta} text-emerald-300`}>
                No guardrail drift detected — accepted policies align with current assessment gaps.
              </p>
            ) : (
              <ul className={`space-y-3 ${appBody}`}>
                {pack.findings.map((f) => (
                  <li
                    key={f.id}
                    className={`rounded-lg border px-4 py-3 ${SEVERITY_STYLE[f.severity] ?? ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                          {f.severity} · {f.kind.replace(/_/g, " ")}
                          {f.framework ? ` · ${f.framework}` : ""}
                        </p>
                        <p className="font-medium text-foreground">{f.title}</p>
                        <p className={`mt-1 font-mono text-sm ${f.playbookId === "—" ? "text-muted" : "text-accent"}`}>
                          {f.playbookId}
                        </p>
                      </div>
                      <Link
                        href={f.href}
                        className="text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                      >
                        Remediate
                      </Link>
                    </div>
                    <p className={`mt-2 ${appMeta} text-muted`}>{f.detail}</p>
                    {f.controlIds.length > 0 ? (
                      <p className={`mt-1 font-mono text-xs text-foreground/80`}>
                        {f.controlIds.join(", ")}
                      </p>
                    ) : null}
                    {f.acceptedAt ? (
                      <p className={`mt-1 ${appMeta} text-muted`}>
                        Accepted {new Date(f.acceptedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </PlaceholderCard>
        </>
      )}
    </>
  );
}
