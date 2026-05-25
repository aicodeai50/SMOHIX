import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import type { RiskHeatLevel } from "@/lib/compliance/compliance-risk-heatmap";
import {
  buildRegulatoryObligationHeatmapPack,
  heatLevelBgClass,
} from "@/lib/compliance/regulatory-obligation-heatmap";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Regulatory obligation heatmap",
  description:
    "Open compliance obligations across frameworks, vendor tiers, and control testing schedules.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

const LEVEL_TEXT: Record<RiskHeatLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  critical: "Critical",
};

const URGENCY_STYLE: Record<string, string> = {
  overdue: "text-danger",
  due_soon: "text-amber-200",
  upcoming: "text-emerald-300",
};

export default async function RegulatoryObligationHeatmapPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Regulatory obligation heatmap"
        description="Sign in to view open obligations across frameworks, vendors, and testing schedules."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/obligation-heatmap");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildRegulatoryObligationHeatmapPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  const maxFrameworkIntensity = Math.max(
    1,
    ...(pack?.frameworkGrid.map((c) => c.intensityScore) ?? [1]),
  );

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Regulatory obligation heatmap"
        description="Visual concentration of open obligations from the GRC calendar, control testing schedules, and assessor evidence requests — intensity reflects overdue and near-term due volume, not mock data."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Join an organization with compliance calendar and testing data to build the obligation heatmap."
          ctas={[
            { href: "/governance/compliance/calendar", label: "GRC calendar" },
            { href: "/governance/compliance/program", label: "Program dashboard" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/obligation-heatmap?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/obligation-heatmap?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:border-accent/35 hover:text-foreground"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/obligation-ics"
              className={`${appMeta} text-accent hover:underline`}
            >
              ICS calendar feed
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className={`rounded-xl border px-4 py-3 lg:col-span-2 ${heatLevelBgClass(
                pack.totalOverdue > 0 ? "critical" : pack.totalDueSoon > 3 ? "elevated" : "low",
              )}`}
            >
              <p className={appOverline}>Open obligations</p>
              <p className={`mt-1 text-3xl font-semibold text-foreground ${appBody}`}>
                {pack.totalOpen}
                <span className={`ml-2 text-base font-normal ${appMeta}`}>
                  {pack.horizonDays}d horizon
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {pack.totalOverdue}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Due within 7 days</p>
              <p className={`mt-1 text-2xl font-semibold text-amber-200 ${appBody}`}>
                {pack.totalDueSoon}
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-2 sm:grid-cols-3">
            {pack.statusColumns.map((col) => (
              <div
                key={col.urgency}
                className={`rounded-lg border px-3 py-3 ${heatLevelBgClass(col.level)}`}
              >
                <p className={appOverline}>{col.label}</p>
                <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                  {col.count}
                </p>
                <p className={`mt-1 ${appMeta} text-muted`}>{LEVEL_TEXT[col.level]} intensity</p>
              </div>
            ))}
          </div>

          <PlaceholderCard title="Framework obligation concentration">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {pack.frameworkGrid.map((cell) => (
                <Link
                  key={cell.key}
                  href={cell.href}
                  className={`rounded-lg border px-3 py-3 transition-opacity hover:opacity-90 ${heatLevelBgClass(cell.level)}`}
                  style={{
                    opacity: 0.55 + (cell.intensityScore / maxFrameworkIntensity) * 0.45,
                  }}
                >
                  <p className={`${appOverline} text-foreground/90`}>{cell.label}</p>
                  <p className={`mt-1 text-xl font-semibold text-foreground ${appBody}`}>
                    {cell.openCount}
                  </p>
                  <p className={`mt-1 ${appMeta} text-muted`}>
                    {cell.overdueCount} overdue · {cell.dueSoonCount} due ≤7d
                  </p>
                </Link>
              ))}
            </div>
          </PlaceholderCard>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <PlaceholderCard title="Vendor tier obligations">
              <div className="grid gap-2 sm:grid-cols-2">
                {pack.vendorTierGrid.map((cell) => (
                  <Link
                    key={cell.key}
                    href={cell.href}
                    className={`rounded-lg border px-3 py-3 ${heatLevelBgClass(cell.level)}`}
                  >
                    <p className={appOverline}>{cell.label}</p>
                    <p className={`mt-1 text-xl font-semibold text-foreground ${appBody}`}>
                      {cell.openCount}
                    </p>
                    <p className={`mt-1 ${appMeta} text-muted`}>
                      intensity {cell.intensityScore} · {LEVEL_TEXT[cell.level]}
                    </p>
                  </Link>
                ))}
              </div>
            </PlaceholderCard>

            <PlaceholderCard title="Control testing schedule kinds">
              <div className="grid gap-2">
                {pack.testingKindGrid.map((cell) => (
                  <Link
                    key={cell.key}
                    href={cell.href}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${heatLevelBgClass(cell.level)}`}
                  >
                    <span className={`font-medium text-foreground ${appBody}`}>{cell.label}</span>
                    <span className="font-mono text-lg font-semibold text-foreground">
                      {cell.openCount}
                    </span>
                  </Link>
                ))}
              </div>
            </PlaceholderCard>
          </div>

          <div className="mt-6">
            <PlaceholderCard title="Priority obligations">
              {pack.topObligations.length === 0 ? (
                <p className={`${appMeta} text-emerald-300`}>
                  No open obligations in the current horizon.
                </p>
              ) : (
                <ul className={`space-y-3 ${appBody}`}>
                  {pack.topObligations.map((o) => (
                    <li
                      key={o.id}
                      className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 ${heatLevelBgClass(
                        o.urgency === "overdue"
                          ? "critical"
                          : o.urgency === "due_soon"
                            ? "elevated"
                            : "low",
                      )}`}
                    >
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {o.bucketLabel} · {o.dimension}
                        </p>
                        <Link href={o.href} className="font-medium text-accent hover:underline">
                          {o.title}
                        </Link>
                        <p className={`mt-1 ${appMeta} text-muted`}>
                          Due {o.dueAt.slice(0, 10)} · {o.statusLabel}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${URGENCY_STYLE[o.urgency] ?? ""}`}
                      >
                        {o.urgency.replace("_", " ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PlaceholderCard>
          </div>
        </>
      )}
    </>
  );
}
