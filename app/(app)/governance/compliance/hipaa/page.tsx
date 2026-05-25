import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildHipaaSecurityAssessmentReport } from "@/lib/compliance/hipaa-assessment";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "HIPAA Security Rule mapping",
  description: "Healthcare safeguards mapped to audit evidence with BAA vendor inheritance.",
};

export const dynamic = "force-dynamic";

const TREND_STYLE: Record<string, string> = {
  improved: "text-emerald-300",
  unchanged: "text-muted",
  regressed: "text-danger",
};

export default async function HipaaSecurityPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="HIPAA Security Rule"
          description="Sign in to view HIPAA safeguard readiness for your organization."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/hipaa");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const report = await buildHipaaSecurityAssessmentReport(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!orgContext.orgId || !report) {
    return (
      <>
        <PageHeader title="HIPAA Security Rule" description="HIPAA safeguard readiness dashboard." />
        <ConsoleEmptyState
          title="Assessment unavailable"
          description="Join or create an organization with compliance mapping enabled to run HIPAA assessment."
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
        title="HIPAA Security Rule mapping"
        description="Administrative, physical, and technical safeguards (45 CFR 164) mapped to shared audit and policy evidence — BAA vendors inherit full HIPAA control set."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance/program" className="text-accent hover:underline">
          Program dashboard
        </Link>
        {" · "}
        <Link href="/governance/third-party-risk" className="text-accent hover:underline">
          Third-party risk (BAA)
        </Link>
        {" · "}
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3">
          <p className={appOverline}>HIPAA readiness</p>
          <p className={`mt-1 text-2xl font-semibold text-sky-200 ${appBody}`}>{report.readinessPercent}%</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Gaps & regressions</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.exceptions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Safeguard domains</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.domainSummary.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>BAA control</p>
          <p className={`mt-1 text-lg font-semibold text-foreground ${appBody}`}>164.308(b)(1)</p>
          <p className={`${appMeta} text-muted`}>Vendor category: healthcare BAA</p>
        </div>
      </div>

      <p className={`mb-6 ${appMeta} text-muted`}>{report.monitoringNote}</p>

      <PlaceholderCard title="Safeguard domain readiness">
        <div className="grid gap-3 sm:grid-cols-3">
          {report.domainSummary.map((d) => (
            <div
              key={d.domain}
              className="rounded-lg border border-white/[0.08] bg-surface/30 px-4 py-3"
            >
              <p className={`font-medium text-foreground ${appBody}`}>{d.domain}</p>
              <p className={`mt-1 text-xl font-semibold text-sky-200 ${appBody}`}>{d.readinessPercent}%</p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {d.covered} covered · {d.partial} partial · {d.none} none
              </p>
            </div>
          ))}
        </div>
      </PlaceholderCard>

      <div className="mt-6">
        <PlaceholderCard title="Safeguard monitoring (30d vs prior 30d)">
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${appBody}`}>
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Safeguard</th>
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
                            framework: "hipaa",
                            ref: row.ref,
                          },
                        ]}
                        max={1}
                      />
                      <p className="mt-1 text-foreground">{row.title}</p>
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
                  <p className="font-mono text-sky-200">{ex.controlRef}</p>
                  <p className="text-foreground">{ex.title}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>{ex.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </PlaceholderCard>

        <PlaceholderCard title="Assessor export">
          <p className={`mb-4 ${appMeta} text-muted`}>
            Download HIPAA assessment JSON. Register BAA vendors under third-party risk with category{" "}
            <span className="font-mono text-foreground">healthcare_baa</span> to inherit all safeguards.
          </p>
          <a
            href="/api/governance/compliance/hipaa"
            className={`inline-flex h-10 items-center rounded-lg border border-sky-400/40 bg-sky-400/10 px-4 font-medium text-sky-200 hover:bg-sky-400/15 ${appBody}`}
          >
            Download HIPAA assessment JSON
          </a>
        </PlaceholderCard>
      </div>
    </>
  );
}
