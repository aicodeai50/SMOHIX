import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { buildCommitteeObligationCapacityBudgetPack } from "@/lib/compliance/committee-obligation-capacity-budget";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { updateCommitteeCapacityBudgetSettingsAction } from "./actions";

export const metadata: Metadata = {
  title: "Committee capacity budget",
  description:
    "Map forecast peak weeks to estimated owner-hours and flag committee capacity shortfalls.",
};

export const dynamic = "force-dynamic";

const HORIZON_DAYS = 90;

function barWidth(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "0%";
  return `${Math.min(100, Math.round((value / max) * 100))}%`;
}

export default async function CommitteeCapacityBudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Committee capacity budget"
        description="Sign in to model committee owner-hours against forecast peaks."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/committee-capacity-budget");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildCommitteeObligationCapacityBudgetPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: HORIZON_DAYS,
        supabase,
      })
    : null;

  const maxHours = Math.max(
    1,
    ...(pack?.weeks.map((w) => Math.max(w.estimatedOwnerHours, w.availableOwnerHours)) ?? [1]),
  );

  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Committee obligation capacity budget"
        description="Maps live forecast peak weeks to estimated owner-hours (obligations × hours each) vs available committee capacity (owners × hours per week)."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Capacity assumptions saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Capacity budget unavailable"
          description="Join an organization with forecast obligations to build a committee capacity budget."
          ctas={[
            { href: "/governance/compliance/obligation-forecast", label: "Forecast" },
            { href: "/governance/compliance/control-ownership", label: "Ownership matrix" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href={`/api/governance/compliance/committee-capacity-budget?horizonDays=${HORIZON_DAYS}&format=csv`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href={`/api/governance/compliance/committee-capacity-budget?horizonDays=${HORIZON_DAYS}&format=json`}
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Capacity owners</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.capacityOwnerCount}
              </p>
              <p className={appMeta}>{pack.accountableOwnerCount} RACI accountable</p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${pack.shortfallWeekCount > 0 ? "border-danger/40 bg-danger/10" : "border-emerald-500/30 bg-emerald-500/5"}`}
            >
              <p className={appOverline}>Shortfall weeks</p>
              <p
                className={`mt-1 text-2xl font-semibold ${pack.shortfallWeekCount > 0 ? "text-danger" : "text-emerald-300"} ${appBody}`}
              >
                {pack.shortfallWeekCount}
              </p>
              <p className={appMeta}>Peak +{pack.peakShortfallHours}h</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Estimated (horizon)</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.totalEstimatedHours}h
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Available (horizon)</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.totalAvailableHours}h
              </p>
            </div>
          </div>

          <p className={`mb-6 ${appMeta} text-muted`}>{pack.committeeSummary}</p>

          {canEdit && !readOnly ? (
            <PlaceholderCard title="Capacity assumptions">
              <form action={updateCommitteeCapacityBudgetSettingsAction} className={`space-y-4 ${appBody}`}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={appLabel} htmlFor="hours_per_obligation">
                      Hours per obligation
                    </label>
                    <input
                      id="hours_per_obligation"
                      name="hours_per_obligation"
                      type="number"
                      min={0.5}
                      max={16}
                      step={0.5}
                      defaultValue={pack.settings.hoursPerObligation}
                      className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className={appLabel} htmlFor="owner_hours_per_week">
                      Owner hours per week
                    </label>
                    <input
                      id="owner_hours_per_week"
                      name="owner_hours_per_week"
                      type="number"
                      min={4}
                      max={40}
                      step={0.5}
                      defaultValue={pack.settings.ownerHoursPerWeek}
                      className="mt-1 w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-full border border-white/[0.14] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide hover:border-accent/35"
                >
                  Save assumptions
                </button>
              </form>
            </PlaceholderCard>
          ) : null}

          <div className="mt-6">
            <PlaceholderCard title="Weekly capacity vs forecast obligations">
              <ul className={`space-y-3 ${appBody}`}>
                {pack.weeks.map((w) => (
                  <li key={w.weekKey}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={w.isCurrentWeek ? "font-semibold text-accent" : ""}>
                        {w.weekLabel}
                        {w.isCurrentWeek ? " (current)" : ""}
                      </span>
                      <span className={appMeta}>
                        {w.estimatedOwnerHours}h est / {w.availableOwnerHours}h avail
                        {w.isShortfall ? (
                          <span className="text-danger"> · −{w.shortfallHours}h short</span>
                        ) : (
                          <span className="text-emerald-300"> · OK</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${w.isShortfall ? "bg-danger/70" : "bg-accent/60"}`}
                        style={{ width: barWidth(w.estimatedOwnerHours, maxHours) }}
                      />
                    </div>
                    <p className={`mt-1 ${appMeta} text-muted`}>
                      {w.obligationCount} obligations · {w.utilizationPercent}% utilization
                    </p>
                  </li>
                ))}
              </ul>
            </PlaceholderCard>
          </div>

          <p className={`mt-6 ${appMeta}`}>
            <Link href="/governance/compliance/obligation-whatif" className="text-accent hover:underline">
              What-if scenarios
            </Link>
            {" · "}
            <Link href="/governance/compliance/obligation-forecast" className="text-accent hover:underline">
              Forecast
            </Link>
            {" · "}
            <Link href="/governance/compliance/control-ownership" className="text-accent hover:underline">
              Ownership matrix
            </Link>
          </p>
        </>
      )}
    </>
  );
}
