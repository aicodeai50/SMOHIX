import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildComplianceProgramDashboard } from "@/lib/compliance/program-dashboard";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compliance program dashboard",
  description: "Executive rollup across SOC 2, ISO 27001, attestations, and third-party risk.",
};

export const dynamic = "force-dynamic";

export default async function ComplianceProgramDashboardPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Compliance program"
          description="Sign in to view your organization compliance program rollup."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/program");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const dashboard = await buildComplianceProgramDashboard(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    auditorReadOnly: isAuditorWorkspaceRole(orgContext.role),
    supabase,
  });

  if (!orgContext.orgId || !dashboard) {
    return (
      <>
        <PageHeader title="Compliance program dashboard" description="Executive governance rollup." />
        <ConsoleEmptyState
          title="Dashboard unavailable"
          description="Join or create an organization with compliance features enabled to view the program dashboard."
          ctas={[{ href: "/governance/compliance", label: "Compliance mapping" }]}
        />
      </>
    );
  }

  const readOnly = isAuditorWorkspaceRole(orgContext.role);

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance program dashboard"
        description="Executive rollup across SOC 2 Type II, ISO 27001 assessment, control attestations, and third-party vendor risk."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 lg:col-span-2">
          <p className={appOverline}>Program readiness</p>
          <p className={`mt-1 text-3xl font-semibold text-accent ${appBody}`}>
            {dashboard.overallReadinessPercent}%
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            Weighted across SOC 2, ISO, PCI, HIPAA, NIST CSF, CIS v8, CMMC L2, GDPR Art. 32, attestations,
            and vendors (
            {dashboard.periodDays}d window)
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Open gaps</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {dashboard.soc2.exceptionCount +
              dashboard.iso27001.exceptionCount +
              dashboard.pcidss.exceptionCount +
              dashboard.hipaa.exceptionCount +
              dashboard.nistCsf.exceptionCount +
              dashboard.cisV8.exceptionCount +
              dashboard.cmmcL2.exceptionCount +
              dashboard.gdprArt32.exceptionCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Overdue attestations</p>
          <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
            {dashboard.attestations.overdue}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Gap remediations</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {dashboard.gapRemediations.open + dashboard.gapRemediations.inProgress}
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.gapRemediations.resolved} resolved ·{" "}
            <Link href="/governance/compliance/runbooks" className="text-accent hover:underline">
              Runbooks
            </Link>
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>SOC 2 readiness</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {dashboard.soc2.readinessPercent}%
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.soc2.trends.improved} improved · {dashboard.soc2.trends.regressed} regressed
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>ISO 27001 readiness</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {dashboard.iso27001.readinessPercent}%
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.iso27001.domainCount} domains
            {dashboard.iso27001.weakestDomain
              ? ` · weakest: ${dashboard.iso27001.weakestDomain}`
              : ""}
          </p>
        </div>
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3">
          <p className={appOverline}>PCI DSS readiness</p>
          <p className={`mt-1 text-2xl font-semibold text-rose-200 ${appBody}`}>
            {dashboard.pcidss.readinessPercent}%
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.pcidss.exceptionCount} gaps
            {dashboard.pcidss.weakestRequirement
              ? ` · weakest: ${dashboard.pcidss.weakestRequirement}`
              : ""}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Attestations</p>
          <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>
            {dashboard.attestations.attested}/{dashboard.attestations.total}
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.attestations.pending} pending
          </p>
        </div>
        <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 px-4 py-3">
          <p className={appOverline}>HIPAA readiness</p>
          <p className={`mt-1 text-2xl font-semibold text-sky-200 ${appBody}`}>
            {dashboard.hipaa.readinessPercent}%
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.hipaa.exceptionCount} gaps
            {dashboard.hipaa.weakestSafeguard
              ? ` · weakest: ${dashboard.hipaa.weakestSafeguard}`
              : ""}
          </p>
        </div>
        <div className="rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3">
          <p className={appOverline}>NIST CSF</p>
          <p className={`mt-1 text-lg font-semibold text-violet-200 ${appBody}`}>
            {dashboard.nistCsf.overallMaturityLabel}
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.nistCsf.readinessPercent}% · {dashboard.nistCsf.exceptionCount} gaps
            {dashboard.nistCsf.weakestFunction
              ? ` · weakest: ${dashboard.nistCsf.weakestFunction}`
              : ""}
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3">
          <p className={appOverline}>CIS v8</p>
          <p className={`mt-1 text-lg font-semibold text-amber-200 ${appBody}`}>
            {dashboard.cisV8.attainedIgLabel}
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.cisV8.readinessPercent}% · {dashboard.cisV8.exceptionCount} gaps
            {dashboard.cisV8.weakestIg ? ` · weakest: ${dashboard.cisV8.weakestIg}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3">
          <p className={appOverline}>CMMC L2</p>
          <p className={`mt-1 text-2xl font-semibold text-cyan-200 ${appBody}`}>
            {dashboard.cmmcL2.sprsScore}
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            SPRS · {dashboard.cmmcL2.sprsBand} · {dashboard.cmmcL2.exceptionCount} gaps
            {dashboard.cmmcL2.weakestFamily ? ` · weakest: ${dashboard.cmmcL2.weakestFamily}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3">
          <p className={appOverline}>GDPR Art. 32</p>
          <p className={`mt-1 text-lg font-semibold text-emerald-200 ${appBody}`}>
            {dashboard.gdprArt32.dpaBand}
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.gdprArt32.readinessPercent}% · {dashboard.gdprArt32.exceptionCount} gaps
            {dashboard.gdprArt32.weakestDomain ? ` · weakest: ${dashboard.gdprArt32.weakestDomain}` : ""}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Third-party vendors</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {dashboard.vendors.count}
          </p>
          <p className={`mt-1 ${appMeta} text-muted`}>
            {dashboard.vendors.critical} critical · {dashboard.vendors.reusedEvidenceCount} audit events
            reused
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Evidence bundles</p>
          <p className={`mt-1 text-xl font-semibold text-foreground ${appBody}`}>
            {dashboard.evidenceBundleCount}
          </p>
          <Link href="/governance/compliance/bundles" className={`${appMeta} text-accent hover:underline`}>
            View bundles
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Legal holds</p>
          <p className={`mt-1 text-xl font-semibold text-foreground ${appBody}`}>
            {dashboard.legalHoldIncidentCount}
          </p>
          <Link href="/governance/legal-holds" className={`${appMeta} text-accent hover:underline`}>
            View holds
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Export</p>
          <a
            href="/api/governance/compliance/program"
            className={`mt-2 inline-flex text-sm font-medium text-accent hover:underline ${appBody}`}
          >
            Download dashboard JSON
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Top control gaps">
          {dashboard.topGaps.length === 0 ? (
            <p className={`${appMeta} text-emerald-300`}>No open gaps in the current monitoring window.</p>
          ) : (
            <ul className={`space-y-3 ${appBody}`}>
              {dashboard.topGaps.map((gap) => (
                <li key={`${gap.framework}-${gap.controlRef}`} className="rounded-lg border border-white/[0.08] px-3 py-2">
                  <p className="font-mono text-accent">
                    {gap.framework === "soc2"
                      ? "SOC 2"
                      : gap.framework === "iso27001"
                        ? "ISO"
                        : gap.framework === "pcidss"
                          ? "PCI"
                          : gap.framework === "hipaa"
                            ? "HIPAA"
                            : gap.framework === "nist_csf"
                              ? "NIST"
                              : gap.framework === "cis_v8"
                                ? "CIS"
                                : gap.framework === "cmmc_l2"
                                  ? "CMMC"
                                  : "GDPR"}{" "}
                    {gap.controlRef}
                  </p>
                  <p className="text-foreground">{gap.title}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>{gap.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>

        <ConsolePanel title="Overdue attestations">
          {dashboard.overdueAttestations.length === 0 ? (
            <p className={`${appMeta} text-emerald-300`}>No overdue control attestations.</p>
          ) : (
            <ul className={`space-y-3 ${appBody}`}>
              {dashboard.overdueAttestations.map((row) => (
                <li key={row.controlRef} className="rounded-lg border border-white/[0.08] px-3 py-2">
                  <p className="font-mono text-accent">{row.controlRef}</p>
                  <p className="text-foreground">{row.title}</p>
                  <p className={`mt-1 ${appMeta} text-muted`}>
                    Due {new Date(row.dueAt).toLocaleDateString()}
                    {row.ownerLabel ? ` · ${row.ownerLabel}` : " · unassigned"}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className={`mt-4 ${appMeta}`}>
            <Link href="/governance/compliance/attestations" className="text-accent hover:underline">
              Open attestation board
            </Link>
            {" · "}
            <Link href="/governance/compliance/runbooks" className="text-accent hover:underline">
              Gap runbooks
            </Link>
          </p>
        </ConsolePanel>
      </div>
    </>
  );
}
