import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { ComplianceHubLinks } from "@/components/compliance/ComplianceHubLinks";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import {
  getStaffingDigestAutoChainOrgSettings,
  listStaffingDigestAutoChainRuns,
  staffingDigestAutoChainPeriodKey,
  STAFFING_DIGEST_AUTO_CHAIN_VERSION,
} from "@/lib/compliance/staffing-digest-auto-chain";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  runStaffingDigestAutoChainAction,
  updateStaffingDigestAutoChainSettingsAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Staffing digest auto-chain",
  description:
    "Run completion rollup, SLA breach digest, and committee escalation in one UTC-week sequence.",
};

export const dynamic = "force-dynamic";

function statusClass(status: string): string {
  if (status === "sent") return "text-emerald-300";
  if (status === "skipped") return "text-muted";
  return "text-danger";
}

export default async function StaffingDigestAutoChainPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    ran?: string;
    sent?: string;
    period?: string;
    saved?: string;
  }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <PageHeader
        title="Staffing digest auto-chain"
        description="Sign in to configure the staffing digest chain."
      />
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/compliance/staffing-digest-auto-chain");
  }

  const sp = await searchParams;
  const orgContext = await getOrgContextForUser(user.id);
  const canEdit = orgContext.role ? canManageMembers(orgContext.role) : false;

  const settings = orgContext.orgId
    ? await getStaffingDigestAutoChainOrgSettings(orgContext.orgId, supabase)
    : null;

  const runs = orgContext.orgId
    ? await listStaffingDigestAutoChainRuns(orgContext.orgId, { supabase })
    : [];

  const periodKey = staffingDigestAutoChainPeriodKey();
  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Staffing digest auto-chain"
        description="One scheduled run per UTC week: completion rollup → SLA breach digest → committee escalation. Replaces three separate cron jobs when enabled."
      />
      <ComplianceHubLinks className={`-mt-4 mb-6 ${appBody}`} />

      {typeof sp.ran === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>
          Auto-chain completed for {sp.period ?? periodKey} — {sp.sent ?? "0"} step(s) delivered.
        </p>
      ) : null}
      {typeof sp.saved === "string" ? (
        <p className={`mb-4 ${appMeta} text-emerald-300`}>Settings saved.</p>
      ) : null}
      {err ? <p className={`mb-4 ${appMeta} text-danger`}>{decodeURIComponent(err)}</p> : null}

      {!orgContext.orgId ? (
        <ConsoleEmptyState title="No organization" description="Join or create an organization first." />
      ) : (
        <>
          <div className="mb-6">
            <ConsolePanel title="Auto-chain overview">
            <p className={appOverline}>Current UTC week</p>
            <p className={`mt-1 font-mono text-sm text-foreground`}>{periodKey}</p>
            <p className={`mt-3 ${appBody}`}>
              Version {STAFFING_DIGEST_AUTO_CHAIN_VERSION}. Cron:{" "}
              <code className="text-xs">POST /api/governance/compliance/staffing-digest-auto-chain/scheduled</code>{" "}
              with Bearer <code className="text-xs">SMOHIX_STAFFING_DIGEST_AUTO_CHAIN_CRON_SECRET</code>.
            </p>
            <div className={`mt-4 flex flex-wrap gap-3 text-sm ${appBody}`}>
              <Link href="/governance/compliance/staffing-completion-rollup" className="text-accent hover:underline">
                Completion rollup
              </Link>
              <span aria-hidden>·</span>
              <Link href="/governance/compliance/staffing-sla-breach-digest" className="text-accent hover:underline">
                SLA breach digest
              </Link>
              <span aria-hidden>·</span>
              <Link
                href="/governance/compliance/cross-staffing-committee-escalation"
                className="text-accent hover:underline"
              >
                Committee escalation
              </Link>
            </div>
            </ConsolePanel>
          </div>

          {canEdit && settings ? (
            <div className="mb-6">
              <ConsolePanel title="Settings & run">
              <form action={updateStaffingDigestAutoChainSettingsAction} className="space-y-4">
                <label className={`flex items-center gap-2 ${appBody}`}>
                  <input
                    type="checkbox"
                    name="auto_chain_enabled"
                    defaultChecked={settings.autoChainEnabled}
                    className="rounded border-white/20"
                  />
                  Enable staffing digest auto-chain
                </label>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium hover:border-accent/35"
                >
                  Save settings
                </button>
              </form>

              <form action={runStaffingDigestAutoChainAction} className="mt-6 flex flex-wrap gap-3 border-t border-white/[0.06] pt-6">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-background hover:opacity-90"
                >
                  Run chain now
                </button>
                <button
                  type="submit"
                  name="force"
                  value="1"
                  className="inline-flex h-9 items-center rounded-lg border border-dashed border-white/[0.12] px-4 text-sm font-medium text-muted hover:text-foreground"
                >
                  Force re-run (this week)
                </button>
              </form>
            </ConsolePanel>
            </div>
          ) : null}

          <ConsolePanel title="Recent runs">
            {runs.length === 0 ? (
              <p className={`mt-3 ${appBody}`}>No auto-chain runs recorded yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {runs.map((run) => (
                  <li
                    key={run.id}
                    className="rounded-xl border border-white/[0.06] bg-black/20 p-4 font-mono text-xs"
                  >
                    <p className="text-foreground/90">
                      {run.periodKey} · {new Date(run.createdAt).toISOString().slice(0, 16).replace("T", " ")} UTC
                      {run.deliveryNote ? ` · ${run.deliveryNote}` : ""}
                    </p>
                    <p className={`mt-2 ${statusClass(run.rollupStatus)}`}>
                      rollup: {run.rollupStatus} — {run.rollupReason}
                    </p>
                    <p className={`mt-1 ${statusClass(run.slaStatus)}`}>
                      sla: {run.slaStatus} — {run.slaReason}
                    </p>
                    <p className={`mt-1 ${statusClass(run.escalationStatus)}`}>
                      escalation: {run.escalationStatus} — {run.escalationReason}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </ConsolePanel>
        </>
      )}
    </>
  );
}
