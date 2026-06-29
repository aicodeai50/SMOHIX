import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildGdprArt32AssessmentReport } from "@/lib/compliance/gdpr-art32-assessment";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "GDPR Article 32",
  description: "Security-of-processing technical measures mapped to audit evidence with DPA readiness scoring.",
};

export const dynamic = "force-dynamic";

const TREND_STYLE: Record<string, string> = {
  improved: "text-emerald-300",
  unchanged: "text-muted",
  regressed: "text-danger",
};

export default async function GdprArt32AssessmentPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="GDPR Article 32"
          description="Sign in to view Article 32 technical measure readiness for your organization."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/gdpr-art32");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const report = await buildGdprArt32AssessmentReport(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!orgContext.orgId || !report) {
    return (
      <>
        <PageHeader title="GDPR Article 32" description="Article 32 technical measures dashboard." />
        <ConsoleEmptyState
          title="Assessment unavailable"
          description="Join or create an organization with compliance mapping enabled to run GDPR Article 32 assessment."
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
        title="GDPR Article 32 technical measures"
        description="Representative security-of-processing measures under Article 32(1) mapped to shared audit and policy evidence for DPA and customer security reviews."
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
        <Link href="/governance/compliance/iso-assessment" className="text-accent hover:underline">
          ISO 27001
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
          <p className={appOverline}>DPA readiness</p>
          <p className={`mt-1 text-lg font-semibold text-emerald-200 ${appBody}`}>{report.dpaBand}</p>
          <p className={`${appMeta} text-muted`}>{report.dpaReadinessPercent}% measure readiness</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Gaps & regressions</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.exceptions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Measure domains</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.domainReadiness.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Evidence bundles</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.evidenceBundleCount}</p>
        </div>
      </div>

      <p className={`mb-6 ${appMeta} text-muted`}>
        {report.dpaBandDescription} {report.monitoringNote}
      </p>

      <ConsolePanel title="Measure domain readiness (Article 32)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.domainReadiness.map((d) => (
            <div
              key={d.domain}
              className="rounded-lg border border-white/[0.08] bg-surface/30 px-4 py-3"
            >
              <p className={`font-medium text-foreground ${appBody}`}>{d.domainLabel}</p>
              <p className={`mt-1 text-xl font-semibold text-emerald-200 ${appBody}`}>{d.readinessPercent}%</p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {d.measureCount} measures · {d.covered} covered · {d.partial} partial
              </p>
            </div>
          ))}
        </div>
      </ConsolePanel>

      <div className="mt-6">
        <ConsolePanel title="Article 32 measure monitoring (30d vs prior 30d)">
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${appBody}`}>
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Measure</th>
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
                            framework: "gdpr_art32",
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
                  <p className="font-mono text-emerald-200">{ex.controlRef}</p>
                  <p className="text-foreground">{ex.title}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>{ex.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>

        <ConsolePanel title="Assessor export">
          <p className={`mb-4 ${appMeta} text-muted`}>
            Download Article 32 assessment JSON for DPA packs, ROPA security annexes, and customer due diligence.
          </p>
          <a
            href="/api/governance/compliance/gdpr-art32"
            className={`inline-flex h-10 items-center rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 font-medium text-emerald-200 hover:bg-emerald-400/15 ${appBody}`}
          >
            Download Article 32 JSON
          </a>
        </ConsolePanel>
      </div>
    </>
  );
}
