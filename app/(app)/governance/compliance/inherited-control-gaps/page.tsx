import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildInheritedControlCoverageGapPack,
  expectedReadinessFloorForTier,
} from "@/lib/compliance/inherited-control-coverage-gaps";
import type { InheritedControlGapKind } from "@/lib/compliance/inherited-control-coverage-gaps";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Inherited control coverage gaps",
  description: "Third-party vendors missing inherited control evidence vs register tier.",
};

export const dynamic = "force-dynamic";

const GAP_STYLE: Record<InheritedControlGapKind, string> = {
  no_audit_evidence: "text-danger",
  overdue_attestation: "text-warning",
  not_attested: "text-amber-200",
};

export default async function InheritedControlGapsPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Inherited control coverage gaps"
        description="Sign in to view vendor inherited control evidence gaps."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/inherited-control-gaps");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildInheritedControlCoverageGapPack(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        supabase,
      })
    : null;

  const topGaps = pack?.gaps.slice(0, 25) ?? [];
  const vendorsBelowFloor =
    pack?.vendorSummaries.filter(
      (v) => v.gapCount > 0 && v.readinessPercent < expectedReadinessFloorForTier(v.riskTier),
    ) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Inherited control coverage gap report"
        description="Surfaces third-party vendors whose inherited SOC 2 / ISO / PCI / HIPAA controls lack linked audit evidence or attestation sign-off relative to their register risk tier."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Coverage gap report unavailable"
          description="Join an organization and register vendors to analyze inherited control coverage."
          ctas={[{ href: "/governance/third-party-risk", label: "Vendor register" }]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/inherited-control-gaps?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/inherited-control-gaps?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/third-party-risk"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Vendor register
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Vendors</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.vendorCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>With gaps</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.vendorsWithGaps}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Total gaps</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.totalGapCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Critical vendors</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.criticalVendorGapCount}
              </p>
            </div>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>
            Monitoring window {pack.periodDays} days · {pack.activeVendorCount} active vendors
          </p>

          {pack.tierSummaries.length > 0 ? (
            <div className="mb-6">
              <PlaceholderCard title="Gaps by risk tier">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.tierSummaries.map((t) => (
                    <li
                      key={t.tier}
                      className="flex flex-wrap justify-between gap-2 border-b border-white/[0.06] pb-2 last:border-0"
                    >
                      <span className="font-medium capitalize">{t.tier}</span>
                      <span className={appMeta}>
                        {t.gapCount} gaps · {t.vendorsWithGaps}/{t.vendorCount} vendors · floor{" "}
                        {expectedReadinessFloorForTier(t.tier)}% readiness
                      </span>
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}

          {vendorsBelowFloor.length > 0 ? (
            <div className="mb-6">
              <PlaceholderCard title="Vendors below tier readiness floor">
                <ul className={`space-y-2 ${appBody}`}>
                  {vendorsBelowFloor.slice(0, 10).map((v) => (
                    <li key={v.vendorId}>
                      <span className="font-medium">{v.vendorName}</span>
                      <span className={appMeta}>
                        {" "}
                        — {v.riskTier} · {v.readinessPercent}% readiness · {v.gapCount} gap(s)
                      </span>
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}

          <PlaceholderCard title="Inherited control gaps">
            {topGaps.length === 0 ? (
              <p className={appMeta}>All inherited controls meet tier evidence expectations.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full min-w-[720px] text-left text-sm ${appBody}`}>
                  <thead>
                    <tr className="border-b border-white/[0.1] text-[11px] uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3">Vendor</th>
                      <th className="py-2 pr-3">Control</th>
                      <th className="py-2 pr-3">Gap</th>
                      <th className="py-2">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topGaps.map((g) => (
                      <tr key={g.id} className="border-b border-white/[0.06] align-top">
                        <td className="py-2 pr-3">
                          <Link href={g.vendorHref} className="text-accent hover:underline">
                            {g.vendorName}
                          </Link>
                          <p className={appMeta}>
                            {g.riskTier} · {g.category}
                          </p>
                        </td>
                        <td className="py-2 pr-3">
                          <span className="font-medium">
                            {g.frameworkLabel} {g.controlRef}
                          </span>
                          <p className={appMeta}>{g.controlTitle}</p>
                        </td>
                        <td className={`py-2 pr-3 ${GAP_STYLE[g.gapKind]}`}>{g.gapKind}</td>
                        <td className={`py-2 ${appMeta}`}>
                          {g.linkedAuditEvidenceCount} audit · {g.attestationStatus ?? "n/a"}
                          <Link href={g.controlHref} className="ml-1 text-accent hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pack.gaps.length > 25 ? (
              <p className={`mt-4 ${appMeta} text-muted`}>
                Showing 25 of {pack.gaps.length} gaps — export CSV for the full report.
              </p>
            ) : null}
          </PlaceholderCard>
        </>
      )}
    </>
  );
}
