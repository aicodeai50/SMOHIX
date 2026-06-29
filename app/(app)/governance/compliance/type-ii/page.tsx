import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildSoc2TypeIIReport } from "@/lib/compliance/type-ii-report";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "SOC 2 Type II report mode",
  description: "Continuous control monitoring with period-over-period trends for external auditors.",
};

export const dynamic = "force-dynamic";

const TREND_STYLE: Record<string, string> = {
  improved: "text-emerald-300",
  unchanged: "text-muted",
  regressed: "text-danger",
};

export default async function Soc2TypeIIPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="SOC 2 Type II"
          description="Sign in to view continuous control monitoring for your organization."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/type-ii");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const report = await buildSoc2TypeIIReport(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!orgContext.orgId || !report) {
    return (
      <>
        <PageHeader title="SOC 2 Type II" description="Continuous control monitoring dashboard." />
        <ConsoleEmptyState
          title="Report unavailable"
          description="Join or create an organization and apply migrations #25–#26 to enable SOC 2 Type II monitoring."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      </>
    );
  }

  const readOnly = isReadOnlyAuditorRole(orgContext.role ?? "viewer");

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="SOC 2 Type II report mode"
        description="Continuous control monitoring with period-over-period trends, exceptions, and assessor evidence inventory."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {" · "}
        <Link href="/governance/compliance/iso-assessment" className="text-accent hover:underline">
          ISO 27001 assessment
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
          <p className={appOverline}>Readiness</p>
          <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{report.readinessPercent}%</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Exceptions</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.exceptions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Evidence bundles</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.evidenceBundleCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Legal holds</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.legalHoldIncidentCount}
          </p>
        </div>
      </div>

      <p className={`mb-6 ${appMeta} text-muted`}>{report.monitoringNote}</p>

      <ConsolePanel title="SOC 2 control monitoring (30d vs prior 30d)">
        <div className="overflow-x-auto">
          <table className={`w-full text-left ${appBody}`}>
            <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2">Control</th>
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
                          framework: "soc2",
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
      </ConsolePanel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Exceptions & gaps">
          {report.exceptions.length === 0 ? (
            <p className={`${appMeta} text-emerald-300`}>No exceptions in the current monitoring window.</p>
          ) : (
            <ul className={`space-y-3 ${appBody}`}>
              {report.exceptions.map((ex) => (
                <li key={ex.controlRef} className="rounded-lg border border-white/[0.08] px-3 py-2">
                  <p className="font-mono text-accent">{ex.controlRef}</p>
                  <p className="text-foreground">{ex.title}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>{ex.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>

        <ConsolePanel title="Assessor export">
          <p className={`mb-4 ${appMeta} text-muted`}>
            Download the structured Type II report JSON for your audit workpapers.
          </p>
          <a
            href="/api/governance/compliance/type-ii"
            className={`inline-flex h-10 items-center rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent hover:bg-accent/15 ${appBody}`}
          >
            Download report JSON
          </a>
          {!readOnly ? (
            <p className={`mt-4 ${appMeta} text-muted`}>
              Invite external auditors under{" "}
              <Link href="/settings/members" className="text-accent hover:underline">
                Members
              </Link>{" "}
              with the <span className="font-mono">auditor</span> role for read-only workspace access.
            </p>
          ) : null}
        </ConsolePanel>
      </div>
    </>
  );
}
