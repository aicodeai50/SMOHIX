import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildControlOwnershipMatrixPack } from "@/lib/compliance/control-ownership-matrix";
import type { AttestationWorkflowStatus } from "@/lib/compliance/attestation/status";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Control ownership matrix",
  description: "RACI-style control owners across frameworks linked to services and attestations.",
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<AttestationWorkflowStatus, string> = {
  attested: "text-emerald-300",
  pending: "text-foreground/80",
  overdue: "text-danger",
};

export default async function ControlOwnershipPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Control ownership matrix"
        description="Sign in to view RACI-style control ownership across frameworks."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/control-ownership");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildControlOwnershipMatrixPack(user.id, { orgId: orgContext.orgId, supabase })
    : null;

  const gapRows = pack?.rows.filter((r) => r.gaps.length > 0).slice(0, 12) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="GRC control ownership matrix"
        description="RACI-style matrix per catalog control: accountable owners from attestations, responsible parties from in-scope services and vendors, consulted policy reviewers, and informed workspace roles — linked to live scope boundary data."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Ownership matrix unavailable"
          description="Join an organization with compliance attestations and scope systems to build the ownership matrix."
          ctas={[
            { href: "/governance/compliance/attestations", label: "Attestations" },
            { href: "/governance/compliance/scope-boundary", label: "Scope boundary" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/control-ownership?format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/control-ownership?format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/attestations"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Assign owners
            </Link>
            <Link
              href="/governance/compliance/scope-boundary"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Scope boundary
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Controls</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.totalControls}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Accountable assigned</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.accountableAssignedCount}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {pack.unassignedAccountableCount} unassigned
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Scope-linked</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.scopeLinkedCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Avg completeness</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.avgCompletenessPercent}%
              </p>
            </div>
          </div>

          {pack.frameworkSummaries.length > 0 ? (
            <div className="mb-6">
            <PlaceholderCard title="By framework">
              <ul className={`space-y-2 ${appBody}`}>
                {pack.frameworkSummaries.map((fw) => (
                  <li
                    key={fw.framework}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.06] pb-2 last:border-0"
                  >
                    <span className="font-medium text-foreground">{fw.label}</span>
                    <span className={appMeta}>
                      {fw.accountableAssigned}/{fw.controlCount} accountable · {fw.scopeLinked} scope-linked ·{" "}
                      {fw.attested} attested
                    </span>
                  </li>
                ))}
              </ul>
            </PlaceholderCard>
            </div>
          ) : null}

          {gapRows.length > 0 ? (
            <div className="mb-6">
            <PlaceholderCard title="Ownership gaps (sample)">
              <ul className={`space-y-3 ${appBody}`}>
                {gapRows.map((row) => (
                  <li key={row.controlId}>
                    <p className="font-medium text-foreground">
                      {row.frameworkLabel} {row.ref} — {row.title}
                    </p>
                    <ul className={`mt-1 list-disc pl-5 ${appMeta} text-muted`}>
                      {row.gaps.map((g) => (
                        <li key={g}>{g}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </PlaceholderCard>
            </div>
          ) : null}

          <PlaceholderCard title="Control RACI matrix">
            <div className="overflow-x-auto">
              <table className={`w-full min-w-[720px] text-left text-sm ${appBody}`}>
                <thead>
                  <tr className="border-b border-white/[0.1] text-[11px] uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3">Control</th>
                    <th className="py-2 pr-3">A</th>
                    <th className="py-2 pr-3">R</th>
                    <th className="py-2 pr-3">C</th>
                    <th className="py-2 pr-3">I</th>
                    <th className="py-2 pr-3">Scope</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pack.rows.map((row) => (
                    <tr key={row.controlId} className="border-b border-white/[0.06] align-top">
                      <td className="py-2 pr-3">
                        <Link href={row.frameworkConsolePath} className="text-accent hover:underline">
                          {row.frameworkLabel} {row.ref}
                        </Link>
                        <p className={`${appMeta} text-muted`}>{row.title}</p>
                      </td>
                      <td className="py-2 pr-3 text-foreground/90">
                        {row.accountable ?? <span className="text-warning">Unassigned</span>}
                      </td>
                      <td className={`py-2 pr-3 ${appMeta}`}>
                        {row.responsible.length > 0 ? row.responsible.join(", ") : "—"}
                      </td>
                      <td className={`py-2 pr-3 ${appMeta}`}>
                        {row.consulted.slice(0, 2).join(", ") || "—"}
                      </td>
                      <td className={`py-2 pr-3 ${appMeta}`}>
                        {row.informed.slice(0, 2).join(", ") || "—"}
                      </td>
                      <td className={`py-2 pr-3 ${appMeta}`}>
                        {row.linkedSystems.filter((s) => s.inScope).length > 0
                          ? row.linkedSystems
                              .filter((s) => s.inScope)
                              .slice(0, 2)
                              .map((s) => s.name)
                              .join(", ")
                          : "—"}
                      </td>
                      <td className={`py-2 ${STATUS_STYLE[row.attestationStatus]}`}>
                        {row.attestationStatus} ({row.completenessPercent}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PlaceholderCard>
        </>
      )}
    </>
  );
}
