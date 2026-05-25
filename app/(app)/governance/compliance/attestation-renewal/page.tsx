import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { buildAttestationRenewalCalendarPack } from "@/lib/compliance/attestation-renewal-calendar";
import type { AttestationRenewalKind } from "@/lib/compliance/attestation-renewal-calendar";
import { getOrgContextForUser } from "@/lib/org/context";
import { isAuditorWorkspaceRole } from "@/lib/org/auditor-workspace";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { runAttestationRenewalNudgesAction } from "./actions";

export const metadata: Metadata = {
  title: "Attestation renewal calendar",
  description: "Renewal waves and owner nudges for expiring control attestations across framework packs.",
};

export const dynamic = "force-dynamic";

const WAVE_STATUS_STYLE = {
  overdue: "text-danger",
  due: "text-warning",
  upcoming: "text-muted",
} as const;

const KIND_STYLE: Record<AttestationRenewalKind, string> = {
  initial: "text-indigo-200",
  recertify: "text-accent",
  overdue: "text-danger",
};

export default async function AttestationRenewalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; emails?: string; skipped?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Attestation renewal calendar"
        description="Sign in to view renewal waves for control attestations."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/attestation-renewal");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isAuditorWorkspaceRole(orgContext.role) : false;
  const canNudge = orgContext.role ? canManageMembers(orgContext.role) : false;

  const pack = orgContext.orgId
    ? await buildAttestationRenewalCalendarPack(user.id, {
        orgId: orgContext.orgId,
        horizonDays: 90,
        supabase,
      })
    : null;

  const topWaves = pack?.waves.slice(0, 12) ?? [];
  const err = typeof sp.error === "string" ? sp.error : undefined;
  const sent = sp.sent === "1";

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Compliance attestation renewal calendar"
        description="Renewal waves group controls due within the horizon (14-day lead windows). Email owners for initial sign-off, recertification, and overdue attestations across all eight framework packs."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />
      {readOnly ? (
        <p className={`-mt-2 mb-6 ${appMeta} text-indigo-200`}>Auditor read-only workspace</p>
      ) : null}

      {!orgContext.orgId || !pack ? (
        <ConsoleEmptyState
          title="Renewal calendar unavailable"
          description="Join an organization to view attestation renewal waves from the live control attestation board."
          ctas={[
            { href: "/governance/compliance/attestations", label: "Attestations" },
            { href: "/governance/compliance/calendar", label: "GRC calendar" },
          ]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/attestation-renewal?horizonDays=90&format=csv"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/attestation-renewal?horizonDays=90&format=json"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Export JSON
            </a>
            {canNudge ? (
              <form action={runAttestationRenewalNudgesAction}>
                <button
                  type="submit"
                  className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent hover:border-accent/60"
                >
                  Nudge owners
                </button>
              </form>
            ) : null}
            <Link
              href="/governance/compliance/attestations"
              className="rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35"
            >
              Attestation board
            </Link>
          </div>

          {err ? (
            <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p>
          ) : null}
          {sent ? (
            <p className={`mb-4 ${appMeta} text-emerald-300`}>
              Owner nudges sent — {sp.emails ?? "0"} email(s)
              {sp.skipped ? `, ${sp.skipped} skipped (dedup or missing address)` : ""}.
            </p>
          ) : null}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
              <p className={appOverline}>Renewals</p>
              <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{pack.totalRenewals}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Waves</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.waveCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Overdue</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>{pack.overdueCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>Unassigned</p>
              <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{pack.unassignedCount}</p>
            </div>
          </div>

          {pack.frameworkSummaries.length > 0 ? (
            <div className="mb-6">
              <PlaceholderCard title="By framework pack">
                <div className="flex flex-wrap gap-2">
                  {pack.frameworkSummaries.map((f) => (
                    <Link
                      key={f.framework}
                      href={f.href}
                      className="rounded-full border border-white/[0.12] px-3 py-1.5 text-xs hover:border-accent/35"
                    >
                      {f.label}: {f.renewalCount}
                      {f.overdueCount > 0 ? (
                        <span className="ml-1 text-danger">({f.overdueCount} overdue)</span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </PlaceholderCard>
            </div>
          ) : null}

          <PlaceholderCard title="Renewal waves">
            {topWaves.length === 0 ? (
              <p className={appMeta}>No attestations due within the {pack.horizonDays}-day horizon.</p>
            ) : (
              <div className="space-y-6">
                {topWaves.map((wave) => (
                  <div key={wave.waveId} className="border-b border-white/[0.06] pb-5 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-semibold ${appBody}`}>{wave.waveLabel}</p>
                      <span
                        className={`text-xs uppercase tracking-wide ${WAVE_STATUS_STYLE[wave.status]}`}
                      >
                        {wave.status}
                      </span>
                      <span className={appMeta}>
                        {wave.controlCount} control(s) · due by {wave.windowEnd.slice(0, 10)}
                      </span>
                    </div>
                    <ul className={`mt-3 space-y-1.5 ${appBody}`}>
                      {wave.items.slice(0, 8).map((item) => (
                        <li key={item.attestationId} className="flex flex-wrap gap-2">
                          <span className={KIND_STYLE[item.renewalKind]}>{item.renewalKind}</span>
                          <span>
                            {item.frameworkLabel} {item.controlRef} — {item.title}
                          </span>
                          <span className={appMeta}>
                            {item.daysUntilDue}d
                            {item.ownerLabel ? ` · ${item.ownerLabel}` : " · unassigned"}
                          </span>
                        </li>
                      ))}
                      {wave.items.length > 8 ? (
                        <li className={appMeta}>+{wave.items.length - 8} more in this wave</li>
                      ) : null}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </PlaceholderCard>

          {pack.ownerNudgeTargets.length > 0 ? (
            <div className="mt-6">
              <PlaceholderCard title="Owner nudge queue">
                <ul className={`space-y-2 ${appBody}`}>
                  {pack.ownerNudgeTargets.slice(0, 10).map((t) => (
                    <li key={t.ownerUserId}>
                      {t.ownerLabel} — {t.controlCount} control(s)
                      {t.overdueCount > 0 ? (
                        <span className="text-danger"> ({t.overdueCount} overdue)</span>
                      ) : null}
                      {t.ownerEmail ? (
                        <span className={`ml-2 ${appMeta} text-muted`}>{t.ownerEmail}</span>
                      ) : (
                        <span className={`ml-2 ${appMeta} text-warning`}>no email</span>
                      )}
                    </li>
                  ))}
                </ul>
              </PlaceholderCard>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
