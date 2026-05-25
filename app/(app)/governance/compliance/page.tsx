import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceControlTags } from "@/components/compliance/ComplianceControlTags";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { getComplianceCoverageSummary } from "@/lib/compliance/summary";
import { getOrgContextForUser } from "@/lib/org/context";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compliance mapping",
  description: "SOC 2 and ISO 27001 control tags mapped to audit evidence and accepted policies.",
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  covered: "text-emerald-300",
  partial: "text-warning",
  none: "text-muted",
};

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ framework?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Compliance mapping"
          description="Sign in to map audit events and accepted policies to SOC 2 / ISO 27001 controls."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance");
  }

  const sp = await searchParams;
  const frameworkRaw = typeof sp.framework === "string" ? sp.framework.trim().toLowerCase() : "all";
  const framework: ComplianceFramework | "all" =
    frameworkRaw === "soc2" ||
    frameworkRaw === "iso27001" ||
    frameworkRaw === "pcidss" ||
    frameworkRaw === "hipaa" ||
    frameworkRaw === "nist_csf" ||
    frameworkRaw === "cis_v8" ||
    frameworkRaw === "cmmc_l2" ||
    frameworkRaw === "gdpr_art32"
      ? frameworkRaw
      : "all";

  const orgContext = await getOrgContextForUser(user.id);
  const summary = await getComplianceCoverageSummary(user.id, {
    supabase,
    orgId: orgContext.orgId,
  });
  const rows =
    framework === "all"
      ? summary.rows
      : summary.rows.filter((r) => r.control.framework === framework);

  const coveredCount = rows.filter((r) => r.status === "covered").length;
  const partialCount = rows.filter((r) => r.status === "partial").length;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance control mapping"
        description="Representative SOC 2, ISO 27001, PCI DSS, HIPAA, NIST CSF, CIS v8, CMMC L2, and GDPR Article 32 controls tagged from audit_log events and accepted automation policies (last 30 days)."
      />
      <ComplianceHubLinks />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <a
          href="/api/governance/compliance/export?window=30d"
          className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
        >
          Export CSV (30d)
        </a>
        <a
          href="/api/governance/compliance/export?window=30d&format=json"
          className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
        >
          Export JSON (30d)
        </a>
        <a
          href="/api/governance/compliance/export?window=all"
          className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
        >
          Export CSV (all)
        </a>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "soc2", "iso27001", "pcidss", "hipaa", "nist_csf", "cis_v8", "cmmc_l2", "gdpr_art32"] as const).map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/governance/compliance" : `/governance/compliance?framework=${f}`}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              framework === f
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-white/[0.14] text-foreground/75 hover:border-accent/35"
            }`}
          >
            {f === "all"
              ? "All frameworks"
              : f === "soc2"
                ? "SOC 2"
                : f === "iso27001"
                  ? "ISO 27001"
                  : f === "pcidss"
                    ? "PCI DSS"
                    : f === "hipaa"
                      ? "HIPAA"
                      : f === "nist_csf"
                        ? "NIST CSF"
                        : f === "cis_v8"
                          ? "CIS v8"
                          : f === "cmmc_l2"
                            ? "CMMC L2"
                            : "GDPR Art. 32"}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Coverage</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {summary.coveragePercent}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Controls w/ evidence</p>
          <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>
            {coveredCount + partialCount}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Audit events (30d)</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {summary.auditEventsScanned}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Accepted policies</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
            {summary.acceptedPolicyCount}
          </p>
        </div>
      </div>

      <PlaceholderCard title="Control coverage matrix">
        {rows.length === 0 ? (
          <ConsoleEmptyState
            title="No controls in view"
            description="Adjust the framework filter or generate audit activity and accept policies to build evidence."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full text-left ${appBody}`}>
              <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Control</th>
                  <th className="px-3 py-2">Domain</th>
                  <th className="px-3 py-2">Audit evidence</th>
                  <th className="px-3 py-2">Policy evidence</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-border ${appMeta}`}>
                {rows.map((row) => (
                  <tr key={row.control.id}>
                    <td className="px-3 py-3">
                      <ComplianceControlTags controls={[row.control]} max={1} />
                      <p className="mt-1 text-foreground">{row.control.title}</p>
                    </td>
                    <td className="px-3 py-3 text-muted">{row.control.domain}</td>
                    <td className="px-3 py-3">{row.auditEvidenceCount}</td>
                    <td className="px-3 py-3">{row.policyEvidenceCount}</td>
                    <td className={`px-3 py-3 capitalize ${STATUS_STYLE[row.status] ?? ""}`}>
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PlaceholderCard>
    </>
  );
}
