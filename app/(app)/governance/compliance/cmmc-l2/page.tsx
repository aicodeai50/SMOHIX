import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildCmmcL2AssessmentReport } from "@/lib/compliance/cmmc-l2-assessment";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CMMC 2.0 Level 2",
  description: "NIST 800-171 practices mapped to audit evidence with SPRS-style readiness scoring.",
};

export const dynamic = "force-dynamic";

const TREND_STYLE: Record<string, string> = {
  improved: "text-emerald-300",
  unchanged: "text-muted",
  regressed: "text-danger",
};

export default async function CmmcL2AssessmentPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="CMMC 2.0 Level 2"
          description="Sign in to view CMMC Level 2 practice readiness for your organization."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/cmmc-l2");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const report = await buildCmmcL2AssessmentReport(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!orgContext.orgId || !report) {
    return (
      <>
        <PageHeader title="CMMC 2.0 Level 2" description="CMMC practice readiness dashboard." />
        <ConsoleEmptyState
          title="Assessment unavailable"
          description="Join or create an organization with compliance mapping enabled to run CMMC Level 2 assessment."
          ctas={[{ href: "/governance/compliance", label: "Compliance mapping" }]}
        />
      </>
    );
  }

  const readOnly = isReadOnlyAuditorRole(orgContext.role ?? "viewer");

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="CMMC 2.0 Level 2 control overlay"
        description="Representative NIST SP 800-171 Rev 2 practices for CMMC Level 2 mapped to shared audit and policy evidence with SPRS-style scoring."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance/program" className="text-accent hover:underline">
          Program dashboard
        </Link>
        {" · "}
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {" · "}
        <Link href="/governance/compliance/cis-v8" className="text-accent hover:underline">
          CIS v8
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3">
          <p className={appOverline}>Estimated SPRS score</p>
          <p className={`mt-1 text-3xl font-semibold text-cyan-200 ${appBody}`}>{report.sprsScore}</p>
          <p className={`${appMeta} text-muted`}>
            {report.sprsBand} · max 110
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Practice readiness</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.readinessPercent}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Gaps & regressions</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.exceptions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>800-171 families</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.familyReadiness.length}
          </p>
        </div>
      </div>

      <p className={`mb-6 ${appMeta} text-muted`}>
        {report.sprsBandDescription} {report.monitoringNote}
      </p>

      <ConsolePanel title="Practice family readiness (800-171)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.familyReadiness.map((fam) => (
            <div
              key={fam.family}
              className="rounded-lg border border-white/[0.08] bg-surface/30 px-4 py-3"
            >
              <p className={`font-medium text-foreground ${appBody}`}>{fam.familyLabel}</p>
              <p className={`mt-1 text-xl font-semibold text-cyan-200 ${appBody}`}>{fam.readinessPercent}%</p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {fam.practiceCount} practices · {fam.covered} covered · {fam.partial} partial
              </p>
            </div>
          ))}
        </div>
      </ConsolePanel>

      <div className="mt-6">
        <ConsolePanel title="CMMC Level 2 practice monitoring (30d vs prior 30d)">
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${appBody}`}>
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Practice</th>
                  <th className="px-3 py-2">Current</th>
                  <th className="px-3 py-2">Prior</th>
                  <th className="px-3 py-2">Trend</th>
                  <th className="px-3 py-2">Audit events</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-border ${appMeta}`}>
                {report.controlMonitoring.map((row) => (
                  <tr key={row.controlId}>
                    <td className="px-3 py-3">
                      <ComplianceControlTags
                        controls={[
                          {
                            id: row.controlId,
                            framework: "cmmc_l2",
                            ref: row.ref,
                          },
                        ]}
                        max={1}
                      />
                      <p className="mt-1 text-foreground">{row.title}</p>
                      <p className={`${appMeta} text-muted`}>{row.domain}</p>
                    </td>
                    <td className="px-3 py-3 capitalize">{row.currentStatus}</td>
                    <td className="px-3 py-3 capitalize">{row.priorStatus}</td>
                    <td className={`px-3 py-3 capitalize ${TREND_STYLE[row.trend] ?? ""}`}>{row.trend}</td>
                    <td className="px-3 py-3 text-muted">
                      {row.auditEvidenceCurrent} / {row.auditEvidencePrior}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ConsolePanel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Gap analysis">
          {report.exceptions.length === 0 ? (
            <p className={`${appMeta} text-emerald-300`}>No gaps in the current monitoring window.</p>
          ) : (
            <ul className={`space-y-3 ${appBody}`}>
              {report.exceptions.map((ex) => (
                <li key={ex.controlRef} className="rounded-lg border border-white/[0.08] px-3 py-2">
                  <p className="font-mono text-cyan-200">{ex.controlRef}</p>
                  <p className="text-foreground">{ex.title}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>{ex.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>

        <ConsolePanel title="Assessor export">
          <p className={`mb-4 ${appMeta} text-muted`}>
            Download CMMC Level 2 assessment JSON for C3PAO / SPRS workpapers alongside other framework exports.
          </p>
          <a
            href="/api/governance/compliance/cmmc-l2"
            className={`inline-flex h-10 items-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 font-medium text-cyan-200 hover:bg-cyan-400/15 ${appBody}`}
          >
            Download CMMC L2 JSON
          </a>
        </ConsolePanel>
      </div>
    </>
  );
}
