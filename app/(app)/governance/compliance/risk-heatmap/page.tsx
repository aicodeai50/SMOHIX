import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildComplianceRiskHeatmap,
  heatLevelBgClass,
  RISK_HEATMAP_FRAMEWORK_ORDER,
} from "@/lib/compliance/compliance-risk-heatmap";
import type { VendorCategory, VendorRiskTier } from "@/lib/third-party-risk/types";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compliance risk heatmap",
  description: "Framework and third-party risk concentration from live program readiness and vendor posture.",
};

export const dynamic = "force-dynamic";

const TIER_ORDER: VendorRiskTier[] = ["critical", "high", "medium", "low"];
const CATEGORY_ORDER: VendorCategory[] = [
  "saas",
  "cloud",
  "security",
  "data_processor",
  "consulting",
  "healthcare_baa",
  "other",
];

const LEVEL_TEXT: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  critical: "Critical",
};

export default async function ComplianceRiskHeatmapPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Compliance risk heatmap"
          description="Sign in to view framework and vendor risk concentration from live org data."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/risk-heatmap");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildComplianceRiskHeatmap(user.id, {
        orgId: orgContext.orgId,
        periodDays: 30,
        auditorReadOnly: readOnly,
        supabase,
      })
    : null;

  const frameworkByKey = new Map(pack?.frameworkCells.map((c) => [c.framework, c]) ?? []);
  const matrixLookup = new Map(
    (pack?.vendorMatrix ?? []).map((c) => [`${c.tier}:${c.category}`, c]),
  );

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance risk heatmap"
        description="Risk concentration across eight framework packs and your third-party vendor register — derived from live audit_log evidence, accepted policies, and vendor control inheritance, not sample scores."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with compliance features to build a live risk heatmap."
          ctas={[{ href: "/governance/compliance/program", label: "Program dashboard" }]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/risk-heatmap?periodDays=30&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/risk-heatmap?periodDays=30&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
            >
              Export JSON
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className={`rounded-xl border px-4 py-3 lg:col-span-2 ${heatLevelBgClass(pack.overallLevel)}`}
            >
              <p className={appOverline}>Overall risk concentration</p>
              <p className={`mt-1 text-3xl font-semibold text-foreground ${appBody}`}>
                {pack.overallRiskScore}
                <span className={`ml-2 text-base font-normal ${appMeta}`}>
                  {LEVEL_TEXT[pack.overallLevel]}
                </span>
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                Program readiness {pack.programReadinessPercent}% · {pack.periodDays}d window
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Overdue attestations</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {pack.attestationOverdue}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Critical / high vendors</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.criticalVendorCount} / {pack.highTierVendorCount}
              </p>
              <Link
                href="/governance/third-party-risk"
                className={`${appMeta} text-accent hover:underline`}
              >
                Vendor register
              </Link>
            </div>
          </div>

          <ConsolePanel title="Framework risk concentration">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {RISK_HEATMAP_FRAMEWORK_ORDER.map((fw) => {
                const cell = frameworkByKey.get(fw);
                if (!cell) return null;
                return (
                  <Link
                    key={fw}
                    href={cell.consolePath}
                    className={`rounded-lg border px-3 py-3 transition-opacity hover:opacity-90 ${heatLevelBgClass(cell.level)}`}
                  >
                    <p className={`${appOverline} text-foreground/90`}>{cell.label}</p>
                    <p className={`mt-1 text-xl font-semibold text-foreground ${appBody}`}>
                      {cell.riskScore}
                    </p>
                    <p className={`mt-1 ${appMeta} text-muted`}>
                      {cell.readinessPercent}% ready · {cell.exceptionCount} gaps
                    </p>
                  </Link>
                );
              })}
            </div>
          </ConsolePanel>

          <div className="mt-6">
            <ConsolePanel title="Vendor tier × category matrix">
              <div className="overflow-x-auto">
                <table className={`w-full min-w-[640px] text-left ${appMeta}`}>
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted">
                      <th className="px-2 py-2">Tier</th>
                      {CATEGORY_ORDER.map((cat) => (
                        <th key={cat} className="px-2 py-2 text-center">
                          {cat.replace("_", " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIER_ORDER.map((tier) => (
                      <tr key={tier} className="border-b border-white/[0.06]">
                        <td className="px-2 py-2 font-semibold capitalize text-foreground">{tier}</td>
                        {CATEGORY_ORDER.map((category) => {
                          const cell = matrixLookup.get(`${tier}:${category}`);
                          if (!cell || cell.vendorCount === 0) {
                            return (
                              <td key={category} className="px-2 py-2 text-center text-muted/50">
                                —
                              </td>
                            );
                          }
                          return (
                            <td key={category} className="px-2 py-2">
                              <div
                                className={`rounded-md border px-2 py-2 text-center ${heatLevelBgClass(cell.level)}`}
                                title={`${cell.vendorCount} vendor(s) · ${cell.avgReadinessPercent}% avg readiness`}
                              >
                                <span className="font-semibold text-foreground">{cell.riskScore}</span>
                                <span className="block text-[10px] text-muted">
                                  n={cell.vendorCount}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`mt-3 ${appMeta} text-muted`}>
                Cell values are composite risk scores (0–100, higher is worse) from vendor tier weight and
                inherited control readiness.
              </p>
            </ConsolePanel>
          </div>

          <div className="mt-6">
            <ConsolePanel title="Top risk hotspots">
              {pack.hotspots.length === 0 ? (
                <p className={`${appMeta} text-emerald-300`}>No elevated concentration in the current window.</p>
              ) : (
                <ul className={`space-y-3 ${appBody}`}>
                  {pack.hotspots.map((h) => (
                    <li
                      key={`${h.kind}-${h.ref}`}
                      className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 ${heatLevelBgClass(h.level)}`}
                    >
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {h.kind === "framework" ? "Framework" : "Vendor"}
                        </p>
                        <Link href={h.href} className="font-medium text-accent hover:underline">
                          {h.label}
                        </Link>
                        <p className={`mt-1 ${appMeta} text-muted`}>{h.detail}</p>
                      </div>
                      <span className="font-mono text-lg font-semibold text-foreground">{h.riskScore}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ConsolePanel>
          </div>
        </>
      )}
    </>
  );
}
