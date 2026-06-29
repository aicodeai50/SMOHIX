import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildComplianceExceptionRegisterPack } from "@/lib/compliance/compliance-exception-register";
import type { ExceptionEntryStatus } from "@/lib/compliance/compliance-exception-register";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compliance exception register",
  description: "Centralized policy and control exceptions with expiry, approver, and framework linkage.",
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<ExceptionEntryStatus, string> = {
  open: "text-warning",
  approved: "text-emerald-300",
  expired: "text-danger",
  remediated: "text-muted",
};

const SEVERITY_STYLE = {
  high: "text-danger",
  medium: "text-warning",
  low: "text-muted",
} as const;

export default async function ExceptionRegisterPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Compliance exception register"
        description="Sign in to view the centralized exception register."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/exception-register");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildComplianceExceptionRegisterPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  const openRows = pack?.rows.filter((r) => r.status === "open" || r.status === "expired").slice(0, 20) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance exception register"
        description="Central register of control assessment gaps, policy drift findings, and compensating remediations — each row includes framework linkage, severity, expiry, and accountable approver from live attestations or remediation actions."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Exception register unavailable"
          description="Join an organization with compliance assessments to build the exception register."
          ctas={[
            { href: "/governance/compliance/program", label: "Program dashboard" },
            { href: "/governance/compliance/policy-drift", label: "Policy drift" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/exception-register?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/exception-register?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/runbooks"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Gap runbooks
            </Link>
            <Link
              href="/governance/compliance/attestations"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Attestations
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Total</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.totalCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Open</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.openCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Approved</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.approvedCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Expired</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.expiredCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Expiring ≤14d</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.expiringWithin14Days}
              </p>
            </div>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>
            {pack.controlExceptionCount} control gaps · {pack.policyExceptionCount} policy drift · monitoring
            window {pack.periodDays} days
          </p>

          {pack.frameworkSummaries.length > 0 ? (
            <div className="mb-6">
              <ConsolePanel title="By framework">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.frameworkSummaries.map((fw) => (
                    <li
                      key={fw.framework}
                      className="flex flex-wrap justify-between gap-2 border-b border-white/[0.06] pb-2 last:border-0"
                    >
                      <span className="font-medium">{fw.label}</span>
                      <span className={appMeta}>
                        {fw.open} open · {fw.approved} approved · {fw.expired} expired · {fw.total} total
                      </span>
                    </li>
                  ))}
                </ul>
              </ConsolePanel>
            </div>
          ) : null}

          <ConsolePanel title="Exception register">
            <div className="overflow-x-auto">
              <table className={`w-full min-w-[800px] text-left text-sm ${appBody}`}>
                <thead>
                  <tr className="border-b border-white/[0.1] text-[11px] uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3">Control / policy</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Severity</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Expires</th>
                    <th className="py-2">Approver</th>
                  </tr>
                </thead>
                <tbody>
                  {(openRows.length > 0 ? openRows : pack.rows.slice(0, 25)).map((row) => (
                    <tr key={row.id} className="border-b border-white/[0.06] align-top">
                      <td className="py-2 pr-3">
                        <Link href={row.href} className="text-accent hover:underline">
                          {row.frameworkLabel} {row.controlRef}
                        </Link>
                        <p className={`${appMeta} text-muted`}>{row.title}</p>
                        <p className={`${appMeta} text-muted/80`}>{row.reason}</p>
                      </td>
                      <td className={`py-2 pr-3 ${appMeta}`}>{row.type.replace("_", " ")}</td>
                      <td className={`py-2 pr-3 ${SEVERITY_STYLE[row.severity]}`}>{row.severity}</td>
                      <td className={`py-2 pr-3 ${STATUS_STYLE[row.status]}`}>{row.status}</td>
                      <td className={`py-2 pr-3 ${appMeta}`}>
                        {row.expiresAt.slice(0, 10)}
                        {row.daysUntilExpiry !== null && row.status === "open" ? (
                          <span className="block text-muted">({row.daysUntilExpiry}d)</span>
                        ) : null}
                      </td>
                      <td className={`py-2 ${appMeta}`}>
                        {row.approverLabel ?? "—"}
                        {row.approvedAt ? (
                          <span className="block text-muted">approved {row.approvedAt.slice(0, 10)}</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pack.rows.length > 25 ? (
              <p className={`mt-4 ${appMeta} text-muted`}>
                Showing {openRows.length > 0 ? "open/expired" : "first 25"} of {pack.rows.length} entries — export
                CSV for the full register.
              </p>
            ) : null}
          </ConsolePanel>
        </>
      )}
    </>
  );
}
