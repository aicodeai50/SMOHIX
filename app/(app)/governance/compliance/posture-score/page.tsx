import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildCompliancePostureScorePack } from "@/lib/compliance/compliance-posture-score";
import type { PostureGrade } from "@/lib/compliance/compliance-posture-score";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compliance posture score",
  description: "Unified org-wide GRC posture blending readiness, vendors, attestations, and gaps.",
};

export const dynamic = "force-dynamic";

const GRADE_RING: Record<PostureGrade, string> = {
  A: "text-emerald-300 border-emerald-500/50",
  B: "text-accent border-accent/45",
  C: "text-amber-200 border-amber-500/40",
  D: "text-warning border-warning/40",
  F: "text-danger border-danger/45",
};

export default async function PostureScorePage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Compliance posture score"
        description="Sign in to view your unified GRC posture score."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/posture-score");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildCompliancePostureScorePack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Unified compliance posture score"
        description="One org-wide score (0–100) from live framework readiness, attestation closure, vendor posture, gap remediation, and inverse risk concentration — higher is stronger."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Posture score unavailable"
          description="Join an organization with compliance assessments to compute the unified posture score."
          ctas={[
            { href: "/governance/compliance/program", label: "Program dashboard" },
            { href: "/governance/compliance/baseline-comparison", label: "All frameworks" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/posture-score?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/posture-score?periodDays=30&format=json"
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
              <p className={appOverline}>Posture score</p>
              <p className="mt-2 text-6xl font-bold tabular-nums">{pack.postureScore}</p>
              <p className={`mt-2 text-lg font-semibold ${appBody}`}>
                Grade {pack.grade} · {pack.gradeLabel}
              </p>
              <p className={`mt-3 text-center ${appMeta} text-muted`}>
                Risk index {pack.overallRiskScore} ({pack.riskLevel})
                {pack.readinessTrendDelta !== 0 ? (
                  <>
                    {" "}
                    · readiness {pack.readinessTrendDelta >= 0 ? "+" : ""}
                    {pack.readinessTrendDelta}%
                  </>
                ) : null}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {pack.pillars.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/[0.08] bg-surface/40 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={appOverline}>{p.label}</p>
                    <span className={`${appMeta} text-muted`}>{Math.round(p.weight * 100)}% weight</span>
                  </div>
                  <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{p.score}%</p>
                  <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                    <div
                      className="h-2 rounded-full bg-accent/70"
                      style={{ width: `${Math.min(100, p.score)}%` }}
                    />
                  </div>
                  <p className={`mt-2 ${appMeta} text-muted`}>{p.detail}</p>
                  <Link
                    href={p.href}
                    className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {pack.drivers.length > 0 ? (
            <PlaceholderCard title="Top score drivers (improvement opportunities)">
              <ul className={`space-y-2 ${appBody}`}>
                {pack.drivers.map((d) => (
                  <li
                    key={d.label}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.08] px-3 py-2"
                  >
                    <span className="text-foreground">{d.label}</span>
                    <Link
                      href={d.href}
                      className="text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                    >
                      Remediate
                    </Link>
                  </li>
                ))}
              </ul>
            </PlaceholderCard>
          ) : (
            <p className={`${appMeta} text-emerald-300`}>
              No major negative drivers — posture pillars are balanced for this period.
            </p>
          )}
        </>
      )}
    </>
  );
}
