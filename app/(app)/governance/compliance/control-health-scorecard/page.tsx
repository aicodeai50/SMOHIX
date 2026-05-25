import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildComplianceControlHealthScorecardPack } from "@/lib/compliance/compliance-control-health-scorecard";
import type { HealthStatus } from "@/lib/compliance/compliance-control-health-scorecard";
import type { PostureGrade } from "@/lib/compliance/compliance-posture-score";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Control health scorecard",
  description:
    "Leadership scorecard blending posture, vendor inherited controls, and gap remediation closure.",
};

export const dynamic = "force-dynamic";

const GRADE_RING: Record<PostureGrade, string> = {
  A: "text-emerald-300 border-emerald-500/50",
  B: "text-accent border-accent/45",
  C: "text-amber-200 border-amber-500/40",
  D: "text-warning border-warning/40",
  F: "text-danger border-danger/45",
};

const STATUS_STYLE: Record<HealthStatus, string> = {
  healthy: "text-emerald-300",
  watch: "text-amber-200",
  critical: "text-danger",
};

export default async function ControlHealthScorecardPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Control health scorecard"
        description="Sign in to view the leadership control health scorecard."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/control-health-scorecard");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildComplianceControlHealthScorecardPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance control health scorecard"
        description="Exportable leadership view combining unified posture, vendor inherited-control coverage, and gap remediation closure — one health score with RAG metrics for board and exec reviews."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Scorecard unavailable"
          description="Join an organization with compliance assessments and vendor data to build the control health scorecard."
          ctas={[
            { href: "/governance/compliance/posture-score", label: "Posture score" },
            { href: "/governance/compliance/program", label: "Program dashboard" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/control-health-scorecard?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/control-health-scorecard?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/executive-summary"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Executive summary
            </Link>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            <div
              className={`flex flex-col items-center justify-center rounded-2xl border px-6 py-10 ${GRADE_RING[pack.grade] ?? ""}`}
            >
              <p className={appOverline}>Control health</p>
              <p className="mt-2 text-6xl font-bold tabular-nums">{pack.healthScore}</p>
              <p className={`mt-2 text-lg font-semibold ${appBody}`}>
                Grade {pack.grade} · {pack.gradeLabel}
              </p>
              <p className={`mt-3 text-center ${appMeta} text-muted`}>{pack.leadershipSummary}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-surface/40 px-4 py-3">
                <p className={appOverline}>Posture (45%)</p>
                <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                  {pack.postureScore}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-surface/40 px-4 py-3">
                <p className={appOverline}>Vendor health (30%)</p>
                <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                  {pack.vendorHealthScore}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-surface/40 px-4 py-3">
                <p className={appOverline}>Gap closure (25%)</p>
                <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                  {pack.gapClosurePercent}%
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
          <PlaceholderCard title="Health metrics">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4 font-semibold">Metric</th>
                    <th className="py-2 pr-4 font-semibold">Score</th>
                    <th className="py-2 pr-4 font-semibold">Status</th>
                    <th className="py-2 font-semibold">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {pack.metrics.map((m) => (
                    <tr key={m.id} className="border-b border-white/[0.06]">
                      <td className="py-3 pr-4">
                        <Link href={m.href} className="font-medium text-accent hover:underline">
                          {m.label}
                        </Link>
                        {m.weight != null ? (
                          <span className={`ml-2 ${appMeta} text-muted`}>
                            {Math.round(m.weight * 100)}% blend
                          </span>
                        ) : null}
                      </td>
                      <td className={`py-3 pr-4 tabular-nums font-semibold ${appBody}`}>{m.score}</td>
                      <td className={`py-3 pr-4 capitalize ${STATUS_STYLE[m.status]}`}>{m.status}</td>
                      <td className={`py-3 ${appMeta} text-muted`}>{m.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PlaceholderCard>
          </div>

          <PlaceholderCard title="Leadership actions">
            <ul className={`list-disc space-y-2 pl-5 ${appBody}`}>
              {pack.leadershipActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            <p className={`mt-4 ${appMeta} text-muted`}>
              {pack.vendorCount} vendor(s) · {pack.vendorsWithGaps} with inherited gaps ·{" "}
              {pack.openGapRemediations} open remediation(s)
            </p>
          </PlaceholderCard>
        </>
      )}
    </>
  );
}
