import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildComplianceKpiTrendsPack } from "@/lib/compliance/compliance-kpi-trends";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compliance KPI trends",
  description: "Readiness, attestation closure, and gap remediation velocity over time.",
};

export const dynamic = "force-dynamic";

function barWidth(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "0%";
  return `${Math.min(100, Math.round((value / max) * 100))}%`;
}

export default async function KpiTrendsPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Compliance KPI trends"
        description="Sign in to view readiness and remediation trends."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/kpi-trends");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildComplianceKpiTrendsPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 90,
        supabase,
      })
    : null;

  const maxWeekly = Math.max(
    1,
    ...(pack?.weeklyActivity.map((w) =>
      Math.max(w.gapsStarted, w.gapsResolved, w.attestationsSigned),
    ) ?? [1]),
  );

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance KPI trend dashboards"
        description="Weekly gap remediation velocity and attestation closure from live audit_log and remediation records; per-framework readiness trends from measured period-over-period baselines."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="KPI trends unavailable"
          description="Join an organization with compliance assessment data to generate KPI trends."
          ctas={[
            { href: "/governance/compliance/program", label: "Program dashboard" },
            { href: "/governance/compliance/baseline-comparison", label: "All frameworks" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/kpi-trends?periodDays=90&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/kpi-trends?periodDays=90&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Avg readiness</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.overallReadinessPercent}%
              </p>
              <p className={`mt-1 ${appMeta} ${pack.overallReadinessDelta >= 0 ? "text-emerald-300" : "text-danger"}`}>
                {pack.overallReadinessDelta >= 0 ? "+" : ""}
                {pack.overallReadinessDelta}% vs prior
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Attestation closure</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.attestationClosurePercent}%
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>{pack.attestationOverdue} overdue</p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Gap velocity</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
                {pack.gapVelocityPerWeek}/wk
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {pack.gapsResolvedTotal} resolved · {pack.gapsStartedTotal} started
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Range</p>
              <p className={`mt-1 text-sm font-medium text-foreground ${appBody}`}>
                {pack.weekKeys.length} weeks · {pack.periodDays}d
              </p>
            </div>
          </div>

          <PlaceholderCard title="Weekly remediation & attestation activity">
            <ul className={`space-y-3 ${appBody}`}>
              {pack.weeklyActivity.map((w) => (
                <li key={w.weekKey} className="rounded-lg border border-white/[0.08] px-3 py-2">
                  <p className={`mb-2 font-mono text-xs text-muted`}>{w.weekKey}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-muted">Resolved</span>
                      <div className="h-2 flex-1 rounded-full bg-white/[0.06]">
                        <div
                          className="h-2 rounded-full bg-emerald-500/70"
                          style={{ width: barWidth(w.gapsResolved, maxWeekly) }}
                        />
                      </div>
                      <span className="w-6 text-right">{w.gapsResolved}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-muted">Started</span>
                      <div className="h-2 flex-1 rounded-full bg-white/[0.06]">
                        <div
                          className="h-2 rounded-full bg-amber-500/60"
                          style={{ width: barWidth(w.gapsStarted, maxWeekly) }}
                        />
                      </div>
                      <span className="w-6 text-right">{w.gapsStarted}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-24 text-muted">Attested</span>
                      <div className="h-2 flex-1 rounded-full bg-white/[0.06]">
                        <div
                          className="h-2 rounded-full bg-accent/70"
                          style={{ width: barWidth(w.attestationsSigned, maxWeekly) }}
                        />
                      </div>
                      <span className="w-6 text-right">{w.attestationsSigned}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </PlaceholderCard>

          <div className="mt-6">
            <PlaceholderCard title="Framework readiness trends">
              <p className={`mb-4 ${appMeta} text-muted`}>
                Endpoints are measured from live assessments; intermediate weeks are interpolated
                between prior and current period readiness.
              </p>
              <ul className={`space-y-4 ${appBody}`}>
                {pack.frameworkTrends.map((f) => {
                  const maxR = Math.max(...f.points.map((p) => p.readinessPercent), 1);
                  return (
                    <li
                      key={f.framework}
                      className="rounded-lg border border-white/[0.08] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{f.label}</p>
                        <span className={`${appMeta} text-muted`}>
                          {f.currentReadiness}% ({f.readinessDelta >= 0 ? "+" : ""}
                          {f.readinessDelta}) · {f.improved}↑ {f.regressed}↓
                        </span>
                      </div>
                      <div className="mt-3 flex items-end gap-1 h-16">
                        {f.points.map((p) => (
                          <div
                            key={p.weekKey}
                            className="flex-1 rounded-t bg-accent/50"
                            style={{ height: barWidth(p.readinessPercent, maxR) }}
                            title={`${p.weekKey}: ${p.readinessPercent}%${p.interpolated ? " (interpolated)" : ""}`}
                          />
                        ))}
                      </div>
                      <Link
                        href={f.consolePath}
                        className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                      >
                        Framework
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </PlaceholderCard>
          </div>
        </>
      )}
    </>
  );
}
