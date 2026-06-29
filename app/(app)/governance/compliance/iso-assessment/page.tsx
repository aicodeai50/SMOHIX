import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildIso27001AssessmentReport } from "@/lib/compliance/iso-assessment";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ISO 27001 continuous assessment",
  description: "Annex A control trends and gap analysis with period-over-period monitoring.",
};

export const dynamic = "force-dynamic";

const TREND_STYLE: Record<string, string> = {
  improved: "text-emerald-300",
  unchanged: "text-muted",
  regressed: "text-danger",
};

export default async function Iso27001AssessmentPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="ISO 27001 assessment"
          description="Sign in to view Annex A continuous assessment for your organization."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/iso-assessment");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const report = await buildIso27001AssessmentReport(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!orgContext.orgId || !report) {
    return (
      <>
        <PageHeader title="ISO 27001 assessment" description="Annex A continuous assessment dashboard." />
        <ConsoleEmptyState
          title="Assessment unavailable"
          description="Join or create an organization with compliance mapping enabled to run ISO 27001 continuous assessment."
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
        title="ISO 27001 continuous assessment"
        description="Annex A control trends, domain readiness, and gap analysis versus the prior monitoring window."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {" · "}
        <Link href="/governance/compliance/type-ii" className="text-accent hover:underline">
          SOC 2 Type II
        </Link>
        {" · "}
        <Link href="/governance/compliance/bundles" className="text-accent hover:underline">
          Evidence bundles
        </Link>
        {" · "}
        <Link href="/audit" className="text-accent hover:underline">
          Audit log
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Annex A readiness</p>
          <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{report.readinessPercent}%</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Gaps & regressions</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.exceptions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Domains tracked</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.domainSummary.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Evidence bundles</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.evidenceBundleCount}</p>
        </div>
      </div>

      <p className={`mb-6 ${appMeta} text-muted`}>{report.monitoringNote}</p>

      <ConsolePanel title="Domain readiness (Annex A)">
        <div className="grid gap-3 sm:grid-cols-2">
          {report.domainSummary.map((d) => (
            <div
              key={d.domain}
              className="rounded-lg border border-white/[0.08] bg-surface/30 px-4 py-3"
            >
              <p className={`font-medium text-foreground ${appBody}`}>{d.domain}</p>
              <p className={`mt-1 text-xl font-semibold text-accent ${appBody}`}>{d.readinessPercent}%</p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {d.covered} covered · {d.partial} partial · {d.none} none ({d.total} controls)
              </p>
            </div>
          ))}
        </div>
      </ConsolePanel>

      <div className="mt-6">
        <ConsolePanel title="Annex A control monitoring (30d vs prior 30d)">
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${appBody}`}>
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Control</th>
                  <th className="px-3 py-2">Domain</th>
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
                            framework: "iso27001",
                            ref: row.ref,
                          },
                        ]}
                        max={1}
                      />
                      <p className="mt-1 text-foreground">{row.title}</p>
                    </td>
                    <td className="px-3 py-3 text-muted">{row.domain}</td>
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
                  <p className="font-mono text-accent">{ex.controlRef}</p>
                  <p className="text-foreground">{ex.title}</p>
                  <p className={`${appMeta} text-muted`}>{ex.domain}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>{ex.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>

        <ConsolePanel title="Assessor export">
          <p className={`mb-4 ${appMeta} text-muted`}>
            Download the structured ISO 27001 assessment JSON including domain summaries.
          </p>
          <a
            href="/api/governance/compliance/iso-assessment"
            className={`inline-flex h-10 items-center rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent hover:bg-accent/15 ${appBody}`}
          >
            Download assessment JSON
          </a>
        </ConsolePanel>
      </div>
    </>
  );
}
