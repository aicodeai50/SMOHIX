import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  buildEvidenceFreshnessDashboard,
  DEFAULT_AGING_DAYS,
  DEFAULT_STALE_DAYS,
} from "@/lib/compliance/evidence-freshness";
import { getOrgContextForUser } from "@/lib/org/context";
import { isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Evidence freshness",
  description: "Per-control last-evidence timestamps and stale-control queue across frameworks.",
};

export const dynamic = "force-dynamic";

const FRESHNESS_STYLE: Record<string, string> = {
  fresh: "text-emerald-300",
  aging: "text-warning",
  stale: "text-danger",
  none: "text-muted",
};

export default async function EvidenceFreshnessPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Evidence freshness"
          description="Sign in to view per-control evidence timestamps and stale queues."
        />
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/evidence-freshness");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const readOnly = orgContext.role ? isReadOnlyAuditorRole(orgContext.role) : false;

  const dashboard = orgContext.orgId
    ? await buildEvidenceFreshnessDashboard(user.id, { orgId: orgContext.orgId, supabase })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Control evidence freshness"
        description={`Last audit and policy evidence timestamps per catalog control. Fresh ≤${DEFAULT_AGING_DAYS}d · Aging ≤${DEFAULT_STALE_DAYS}d · Stale beyond ${DEFAULT_STALE_DAYS}d or missing history.`}
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/governance/compliance" className="text-accent hover:underline">
          Compliance mapping
        </Link>
        {" · "}
        <Link href="/governance/compliance/attestations" className="text-accent hover:underline">
          Attestations
        </Link>
        {" · "}
        <Link href="/audit" className="text-accent hover:underline">
          Audit log
        </Link>
        {readOnly ? (
          <>
            {" · "}
            <span className="text-indigo-200">Auditor read-only workspace</span>
          </>
        ) : null}
      </p>

      {!orgContext.orgId || !dashboard ? (
        <ConsoleEmptyState
          title="Organization required"
          description="Create an organization to track evidence freshness across your control catalog."
          ctas={[{ href: "/settings/members", label: "Members & roles" }]}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <a
              href="/api/governance/compliance/evidence-freshness?format=csv"
              className="inline-flex h-10 items-center rounded-lg border border-accent/40 bg-accent/10 px-4 font-medium text-accent hover:bg-accent/15"
            >
              Export CSV
            </a>
            <a
              href="/api/governance/compliance/evidence-freshness?format=json"
              className={`rounded-full border border-white/[0.14] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/75 hover:border-accent/35 ${appBody}`}
            >
              Export JSON
            </a>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
              <p className={appOverline}>Fresh</p>
              <p className={`mt-1 text-2xl font-semibold text-emerald-300 ${appBody}`}>
                {dashboard.summary.fresh}
              </p>
            </div>
            <div className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3">
              <p className={appOverline}>Aging</p>
              <p className={`mt-1 text-2xl font-semibold text-warning ${appBody}`}>
                {dashboard.summary.aging}
              </p>
            </div>
            <div className="rounded-xl border border-danger/30 bg-danger-dim/40 px-4 py-3">
              <p className={appOverline}>Stale</p>
              <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>
                {dashboard.summary.stale}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
              <p className={appOverline}>No evidence</p>
              <p className={`mt-1 text-2xl font-semibold text-muted ${appBody}`}>
                {dashboard.summary.none}
              </p>
            </div>
          </div>

          <ConsolePanel title="By framework">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dashboard.byFramework.map((fw) => (
                <div
                  key={fw.framework}
                  className="rounded-lg border border-border bg-background/40 px-3 py-2"
                >
                  <p className={`font-medium text-foreground ${appBody}`}>{fw.label}</p>
                  <p className={`${appMeta} text-muted`}>
                    {fw.fresh} fresh · {fw.aging} aging · {fw.stale} stale · {fw.none} none
                  </p>
                </div>
              ))}
            </div>
          </ConsolePanel>

          <div className="mt-6">
            <ConsolePanel title="Stale control queue">
              {dashboard.staleQueue.length === 0 ? (
                <p className={`${appMeta} text-emerald-300`}>
                  No stale or empty controls — all catalog items have recent evidence.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-left ${appBody}`}>
                    <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-3 py-2">Control</th>
                        <th className="px-3 py-2">Freshness</th>
                        <th className="px-3 py-2">Last evidence</th>
                        <th className="px-3 py-2">30d coverage</th>
                        <th className="px-3 py-2">Audit</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y divide-border ${appMeta}`}>
                      {dashboard.staleQueue.slice(0, 24).map((row) => (
                        <tr key={row.controlId}>
                          <td className="px-3 py-3">
                            <span className="font-mono text-[11px] text-foreground/90">{row.ref}</span>
                            <span className="block text-muted">{row.title}</span>
                          </td>
                          <td className={`px-3 py-3 capitalize font-medium ${FRESHNESS_STYLE[row.freshness]}`}>
                            {row.freshness}
                          </td>
                          <td className="px-3 py-3 text-muted">
                            {row.effectiveLastEvidenceAt
                              ? `${row.effectiveLastEvidenceAt.slice(0, 10)} (${row.daysSinceEvidence}d)`
                              : "—"}
                          </td>
                          <td className="px-3 py-3 capitalize">{row.coverageStatus30d}</td>
                          <td className="px-3 py-3">
                            <Link href={row.auditEvidenceHref} className="text-accent hover:underline">
                              View audit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dashboard.staleQueue.length > 24 ? (
                    <p className={`mt-3 ${appMeta} text-muted`}>
                      Showing 24 of {dashboard.staleQueue.length} stale controls — export CSV for the full list.
                    </p>
                  ) : null}
                </div>
              )}
            </ConsolePanel>
          </div>

          <div className="mt-6">
            <ConsolePanel title="All controls (sample)">
              <div className="overflow-x-auto">
                <table className={`w-full text-left ${appBody}`}>
                  <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2">Framework</th>
                      <th className="px-3 py-2">Control</th>
                      <th className="px-3 py-2">Freshness</th>
                      <th className="px-3 py-2">Last audit</th>
                      <th className="px-3 py-2">Last policy</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-border ${appMeta}`}>
                    {dashboard.rows.slice(0, 16).map((row) => (
                      <tr key={row.controlId}>
                        <td className="px-3 py-3 capitalize text-muted">{row.framework.replace(/_/g, " ")}</td>
                        <td className="px-3 py-3 font-mono text-[11px]">{row.ref}</td>
                        <td className={`px-3 py-3 capitalize ${FRESHNESS_STYLE[row.freshness]}`}>
                          {row.freshness}
                        </td>
                        <td className="px-3 py-3 text-muted">
                          {row.lastAuditEvidenceAt?.slice(0, 10) ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-muted">
                          {row.lastPolicyEvidenceAt?.slice(0, 10) ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={`mt-3 ${appMeta} text-muted`}>
                Scanned {dashboard.auditEventsScanned} audit events ({dashboard.periodDays}d coverage window,{" "}
                {DEFAULT_STALE_DAYS}d stale threshold).
              </p>
            </ConsolePanel>
          </div>
        </>
      )}
    </>
  );
}
