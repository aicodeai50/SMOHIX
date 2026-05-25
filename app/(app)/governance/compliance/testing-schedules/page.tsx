import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildControlTestingSchedulesPack } from "@/lib/compliance/control-testing-schedules";
import type {
  ControlTestingScheduleKind,
  ControlTestingScheduleStatus,
} from "@/lib/compliance/control-testing-schedules";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Control testing schedules",
  description: "Recurring evidence collection tied to attestations and framework checkpoints.",
};

export const dynamic = "force-dynamic";

const KIND_STYLE: Record<ControlTestingScheduleKind, string> = {
  attestation_evidence: "text-indigo-200 border-indigo-400/30 bg-indigo-500/10",
  framework_checkpoint: "text-accent border-accent/35 bg-accent/10",
  freshness_retest: "text-amber-200 border-amber-500/30 bg-amber-500/10",
  scheduled_bundle: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
};

const STATUS_STYLE: Record<ControlTestingScheduleStatus, string> = {
  overdue: "text-danger",
  due: "text-warning",
  upcoming: "text-muted",
  completed: "text-muted",
};

export default async function TestingSchedulesPage() {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Control testing schedules"
        description="Sign in to view automated evidence collection windows."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/testing-schedules");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildControlTestingSchedulesPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: 90,
        supabase,
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Automated control testing schedules"
        description="Recurring evidence windows from live attestation due dates, quarterly framework checkpoints, stale-control retests, and bundle cadence — aligned with your GRC calendar."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Schedules unavailable"
          description="Join an organization to generate testing schedules from attestations and evidence posture."
          ctas={[
            { href: "/governance/compliance/attestations", label: "Attestations" },
            { href: "/governance/compliance/calendar", label: "GRC calendar" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/testing-schedules?horizonDays=90&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/testing-schedules?horizonDays=90&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            <Link
              href="/governance/compliance/calendar"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              GRC calendar
            </Link>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>{pack.overdueCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Due now</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.dueCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Upcoming</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>
                {pack.upcomingCount}
              </p>
              <p className={`mt-1 ${appMeta} text-muted`}>{pack.horizonDays}d horizon</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>By type</p>
              <p className={`mt-1 text-sm font-medium text-foreground ${appBody}`}>
                {pack.attestationScheduleCount} att · {pack.checkpointScheduleCount} chk ·{" "}
                {pack.freshnessRetestCount} fresh · {pack.bundleScheduleCount} bundle
              </p>
            </div>
          </div>

          <PlaceholderCard title="Active schedules">
            {pack.schedules.length === 0 ? (
              <p className={`${appMeta} text-emerald-300`}>
                No open collection windows — attestations current and evidence fresh.
              </p>
            ) : (
              <ul className={`space-y-3 ${appBody}`}>
                {pack.schedules.map((s) => (
                  <li
                    key={s.id}
                    className={`rounded-lg border px-4 py-3 ${KIND_STYLE[s.kind] ?? ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                          {s.kind.replace(/_/g, " ")} · {s.cadenceLabel}
                        </p>
                        <p className="font-medium text-foreground">{s.title}</p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[s.status] ?? ""}`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className={`mt-2 ${appMeta} text-muted`}>{s.detail}</p>
                    <p className={`mt-1 font-mono text-xs text-foreground/80`}>
                      Window {s.windowStart.slice(0, 10)} → {s.windowEnd.slice(0, 10)}
                      {s.controlCount > 0 ? ` · ${s.controlCount} controls` : ""}
                    </p>
                    <Link
                      href={s.href}
                      className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-wide text-accent hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PlaceholderCard>
        </>
      )}
    </>
  );
}
