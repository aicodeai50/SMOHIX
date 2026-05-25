import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildCisV8AssessmentReport } from "@/lib/compliance/cis-v8-assessment";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CIS Controls v8",
  description: "Implementation Group safeguards mapped to audit evidence with IG readiness scoring.",
};

export const dynamic = "force-dynamic";

const TREND_STYLE: Record<string, string> = {
  improved: "text-emerald-300",
  unchanged: "text-muted",
  regressed: "text-danger",
};

export default async function CisV8AssessmentPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="CIS Controls v8"
          description="Sign in to view CIS safeguard readiness for your organization."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/cis-v8");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const report = await buildCisV8AssessmentReport(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!orgContext.orgId || !report) {
    return (
      <>
        <PageHeader title="CIS Controls v8" description="CIS safeguard readiness dashboard." />
        <ConsoleEmptyState
          title="Assessment unavailable"
          description="Join or create an organization with compliance mapping enabled to run CIS Controls v8 assessment."
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
        title="CIS Controls v8 safeguard pack"
        description="Representative CIS v8 safeguards across Implementation Groups (IG1–IG3) mapped to shared audit and policy evidence."
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
        <Link href="/governance/compliance/nist-csf" className="text-accent hover:underline">
          NIST CSF
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
          <p className={appOverline}>Attained IG posture</p>
          <p className={`mt-1 text-lg font-semibold text-amber-200 ${appBody}`}>{report.attainedIgLabel}</p>
          <p className={`${appMeta} text-muted`}>
            {report.readinessPercent}% overall · {report.exceptions.length} gaps
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Safeguards tracked</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.controlMonitoring.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Implementation groups</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {report.igReadiness.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Evidence bundles</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{report.evidenceBundleCount}</p>
        </div>
      </div>

      <p className={`mb-6 ${appMeta} text-muted`}>{report.monitoringNote}</p>

      <PlaceholderCard title="Implementation Group readiness">
        <div className="grid gap-3 sm:grid-cols-3">
          {report.igReadiness.map((ig) => (
            <div
              key={ig.implementationGroup}
              className="rounded-lg border border-white/[0.08] bg-surface/30 px-4 py-3"
            >
              <p className={`font-medium text-foreground ${appBody}`}>{ig.groupLabel}</p>
              <p className={`mt-1 text-xl font-semibold text-amber-200 ${appBody}`}>{ig.readinessPercent}%</p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {ig.safeguardCount} safeguards · {ig.covered} covered · {ig.partial} partial · {ig.none} none
              </p>
            </div>
          ))}
        </div>
      </PlaceholderCard>

      <div className="mt-6">
        <PlaceholderCard title="CIS safeguard monitoring (30d vs prior 30d)">
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
                            framework: "cis_v8",
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
                  <p className="font-mono text-amber-200">{ex.controlRef}</p>
                  <p className="text-foreground">{ex.title}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>{ex.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </PlaceholderCard>

        <PlaceholderCard title="Assessor export">
          <p className={`mb-4 ${appMeta} text-muted`}>
            Download CIS v8 assessment JSON for benchmark workpapers alongside other framework exports.
          </p>
          <a
            href="/api/governance/compliance/cis-v8"
            className={`inline-flex h-10 items-center rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 font-medium text-amber-200 hover:bg-amber-400/15 ${appBody}`}
          >
            Download CIS v8 JSON
          </a>
        </PlaceholderCard>
      </div>
    </>
  );
}
