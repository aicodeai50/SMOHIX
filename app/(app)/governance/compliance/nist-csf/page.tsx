import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildNistCsfAlignmentReport } from "@/lib/compliance/nist-csf-assessment";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NIST CSF 2.0 alignment",
  description: "Cybersecurity Framework functions mapped to audit evidence with maturity tiers.",
};

export const dynamic = "force-dynamic";

const TREND_STYLE: Record<string, string> = {
  improved: "text-emerald-300",
  unchanged: "text-muted",
  regressed: "text-danger",
};

export default async function NistCsfAlignmentPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="NIST CSF 2.0"
          description="Sign in to view NIST Cybersecurity Framework alignment for your organization."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/nist-csf");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const report = await buildNistCsfAlignmentReport(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!orgContext.orgId || !report) {
    return (
      <>
        <PageHeader title="NIST CSF 2.0 alignment" description="NIST CSF readiness dashboard." />
        <ConsoleEmptyState
          title="Assessment unavailable"
          description="Join or create an organization with compliance mapping enabled to run NIST CSF alignment."
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
        title="NIST CSF 2.0 alignment"
        description="Core functions (Govern, Identify, Protect, Detect, Respond, Recover) mapped to shared audit and policy evidence with implementation maturity tiers."
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
        <Link href="/governance/compliance/type-ii" className="text-accent hover:underline">
          SOC 2 Type II
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3">
          <p className={appOverline}>Overall maturity</p>
          <p className={`mt-1 text-lg font-semibold text-violet-200 ${appBody}`}>
            {report.overallMaturityLabel}
          </p>
          <p className={`${appMeta} text-muted`}>Tier {report.overallMaturityTier} · {report.readinessPercent}% readiness</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Gaps & regressions</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.exceptions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Functions tracked</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.functionMaturity.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Evidence bundles</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.evidenceBundleCount}</p>
        </div>
      </div>

      <p className={`mb-6 ${appMeta} text-muted`}>{report.monitoringNote}</p>

      <PlaceholderCard title="Function maturity (NIST CSF 2.0)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.functionMaturity.map((fn) => (
            <div
              key={fn.function}
              className="rounded-lg border border-white/[0.08] bg-surface/30 px-4 py-3"
            >
              <p className={`font-medium text-foreground ${appBody}`}>{fn.function}</p>
              <p className={`mt-1 text-sm font-medium text-violet-200 ${appBody}`}>{fn.tierLabel}</p>
              <p className={`mt-1 text-xl font-semibold text-violet-200/90 ${appBody}`}>{fn.readinessPercent}%</p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {fn.covered} covered · {fn.partial} partial · {fn.none} none
              </p>
            </div>
          ))}
        </div>
      </PlaceholderCard>

      <div className="mt-6">
        <PlaceholderCard title="NIST CSF control monitoring (30d vs prior 30d)">
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${appBody}`}>
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Outcome</th>
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
                            framework: "nist_csf",
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
        </PlaceholderCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PlaceholderCard title="Gap analysis">
          {report.exceptions.length === 0 ? (
            <p className={`${appMeta} text-emerald-300`}>No gaps in the current monitoring window.</p>
          ) : (
            <ul className={`space-y-3 ${appBody}`}>
              {report.exceptions.map((ex) => (
                <li key={ex.controlRef} className="rounded-lg border border-white/[0.08] px-3 py-2">
                  <p className="font-mono text-violet-200">{ex.controlRef}</p>
                  <p className="text-foreground">{ex.title}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>{ex.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </PlaceholderCard>

        <PlaceholderCard title="Assessor export">
          <p className={`mb-4 ${appMeta} text-muted`}>
            Download NIST CSF alignment JSON for framework workpapers alongside SOC 2, ISO, PCI, and HIPAA exports.
          </p>
          <a
            href="/api/governance/compliance/nist-csf"
            className={`inline-flex h-10 items-center rounded-lg border border-violet-400/40 bg-violet-400/10 px-4 font-medium text-violet-200 hover:bg-violet-400/15 ${appBody}`}
          >
            Download NIST CSF JSON
          </a>
        </PlaceholderCard>
      </div>
    </>
  );
}
