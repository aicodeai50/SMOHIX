import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { GrcCalendarMonthGrid } from "@/components/compliance/GrcCalendarMonthGrid";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildGrcComplianceCalendar,
  dayKeyFromIso,
  monthGridForPack,
} from "@/lib/compliance/grc-calendar";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Compliance calendar",
  description: "GRC calendar for attestations, vendor reviews, bundles, and audit season checkpoints.",
};

export const dynamic = "force-dynamic";

function parseMonthParam(raw: string | undefined, fallback: Date): { year: number; month: number } {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const [y, m] = raw.split("-").map((n) => Number.parseInt(n, 10));
    if (y >= 2020 && m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  return { year: fallback.getUTCFullYear(), month: fallback.getUTCMonth() };
}

function monthNavHref(year: number, month: number, delta: number): string {
  const d = new Date(Date.UTC(year, month, 1));
  d.setUTCMonth(d.getUTCMonth() + delta);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `/governance/compliance/calendar?month=${y}-${m}`;
}

export default async function ComplianceCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Compliance calendar"
          description="Sign in to view the GRC audit season planner."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/calendar");
  }

  const sp = await searchParams;
  const now = new Date();
  const { year, month } = parseMonthParam(sp.month, now);
  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildGrcComplianceCalendar(user.id, {
        orgId: orgContext.orgId,
        horizonDays: 90,
        supabase,
      })
    : null;

  const todayKey = dayKeyFromIso(now.toISOString());
  const grid = pack ? monthGridForPack(pack, year, month) : null;
  const prevHref = monthNavHref(year, month, -1);
  const nextHref = monthNavHref(year, month, 1);

  const upcomingList = pack?.events.filter((e) => e.status !== "completed").slice(0, 12) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance calendar & audit season"
        description="Attestation due dates, vendor reviews, evidence bundle cadence, framework checkpoints, and scheduled digest/SLA cadence from your organization's live GRC data."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack || !grid ? (
        <ConsoleEmptyState
          title="Calendar unavailable"
          description="Join an organization to map compliance milestones on the shared GRC calendar."
          ctas={[{ href: "/governance/compliance/program", label: "Program dashboard" }]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/calendar?horizonDays=90&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/calendar?horizonDays=90&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/obligation-ics"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              ICS calendar
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-3 lg:col-span-2">
              <p className={appOverline}>Audit season</p>
              <p className={`mt-1 text-xl font-semibold text-violet-200 ${appBody}`}>
                {pack.auditSeason.label} close · {pack.auditSeason.daysUntilQuarterEnd}d
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>
                {pack.auditSeason.frameworkCount} framework checkpoints on{" "}
                {new Date(pack.auditSeason.quarterEnd).toLocaleDateString()} · {pack.auditSeason.periodDays}
                d assessment window
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Upcoming</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.upcomingCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {pack.overdueCount}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ConsolePanel title={`${grid.monthLabel} planner`}>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <Link
                    href={prevHref}
                    className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
                  >
                    ← Prev
                  </Link>
                  <p className={`${appMeta} text-muted`}>{grid.monthLabel}</p>
                  <Link
                    href={nextHref}
                    className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
                  >
                    Next →
                  </Link>
                </div>
                <GrcCalendarMonthGrid
                  weeks={grid.weeks}
                  eventsByDay={pack.eventsByDay}
                  todayKey={todayKey}
                />
                <p className={`mt-4 ${appMeta} text-muted`}>
                  Legend: attestations (teal) · vendors (cyan) · bundles (green) · framework checkpoints
                  (violet) · digest/SLA cadence (gray)
                </p>
              </ConsolePanel>
            </div>

            <ConsolePanel title="Next 90 days">
              <ul className={`space-y-2 ${appBody}`}>
                {upcomingList.length === 0 ? (
                  <li className={`${appMeta} text-emerald-300`}>No upcoming milestones.</li>
                ) : (
                  upcomingList.map((e) => (
                    <li key={e.id} className="rounded-lg border border-white/[0.08] px-3 py-2">
                      <p className={`text-[10px] uppercase tracking-wide text-muted`}>
                        {new Date(e.startsAt).toLocaleDateString()} · {e.status}
                      </p>
                      <Link href={e.href} className="font-medium text-accent hover:underline">
                        {e.title}
                      </Link>
                      <p className={`mt-0.5 ${appMeta} text-muted`}>{e.detail}</p>
                    </li>
                  ))
                )}
              </ul>
              <p className={`mt-4 ${appMeta} text-muted`}>
                Digest webhook: {pack.digestWebhookConfigured ? "configured" : "not set"} · SLA
                reminders: {pack.slaRemindersEnabled ? "enabled" : "disabled"}
              </p>
            </ConsolePanel>
          </div>
        </>
      )}
    </>
  );
}
