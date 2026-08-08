import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { listAccessRulesForUser, listAccessSnapshotsForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  createAccessRuleAction,
  createAccessSnapshotAction,
  deleteAccessRuleAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Access governance",
  description: "Track MFA and privileged-access posture plus policy thresholds.",
};

export const dynamic = "force-dynamic";

export default async function GovernanceAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Access governance"
          description="Connect Supabase and sign in to track MFA posture and privileged-account governance."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>Local mode does not persist governance posture data.</p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/access");
  }

  const [rules, snapshots] = await Promise.all([
    listAccessRulesForUser(user.id),
    listAccessSnapshotsForUser(user.id),
  ]);
  const latest = snapshots[0] ?? null;

  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Access posture"
        description="Set policy thresholds and ingest MFA posture snapshots to enforce safer high-risk operations."
      />
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="smohix-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Policy rules</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{rules.length}</p>
        </div>
        <div className="smohix-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Latest MFA coverage</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {latest?.mfaCoveragePercent != null ? `${latest.mfaCoveragePercent}%` : "n/a"}
          </p>
        </div>
        <div className="smohix-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Stale privileged accounts</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {latest?.stalePrivilegedAccounts ?? "n/a"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Add policy rule">
          <form action={createAccessRuleAction} className="space-y-3">
            <div>
              <label htmlFor="rule-name" className={`mb-1 block ${appLabel}`}>
                Rule name
              </label>
              <input
                id="rule-name"
                name="rule_name"
                required
                maxLength={200}
                placeholder="Block high-risk if MFA coverage below threshold"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="rule-threshold" className={`mb-1 block ${appLabel}`}>
                Minimum MFA coverage %
              </label>
              <input
                id="rule-threshold"
                name="min_mfa_coverage_percent"
                type="number"
                min={0}
                max={100}
                step="0.1"
                placeholder="95"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <label className={`inline-flex items-center gap-2 ${appBody}`}>
              <input
                type="checkbox"
                name="block_high_risk_without_approval"
                defaultChecked
                className="h-4 w-4 rounded border-border bg-background"
              />
              Block high-risk changes without approval
            </label>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add rule
            </button>
          </form>
        </ConsolePanel>

        <ConsolePanel title="Add posture snapshot">
          <form action={createAccessSnapshotAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="snap-captured" className={`mb-1 block ${appLabel}`}>
                  Captured at
                </label>
                <input
                  id="snap-captured"
                  name="captured_at"
                  type="datetime-local"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="snap-source" className={`mb-1 block ${appLabel}`}>
                  Source system
                </label>
                <input
                  id="snap-source"
                  name="source_system"
                  maxLength={120}
                  placeholder="Okta"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="snap-mfa" className={`mb-1 block ${appLabel}`}>
                  MFA coverage %
                </label>
                <input
                  id="snap-mfa"
                  name="mfa_coverage_percent"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="snap-total" className={`mb-1 block ${appLabel}`}>
                  Privileged accounts total
                </label>
                <input
                  id="snap-total"
                  name="privileged_accounts_total"
                  type="number"
                  min={0}
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="snap-enabled" className={`mb-1 block ${appLabel}`}>
                  Privileged with MFA
                </label>
                <input
                  id="snap-enabled"
                  name="privileged_accounts_mfa_enabled"
                  type="number"
                  min={0}
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="snap-stale" className={`mb-1 block ${appLabel}`}>
                  Stale privileged accounts
                </label>
                <input
                  id="snap-stale"
                  name="stale_privileged_accounts"
                  type="number"
                  min={0}
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add snapshot
            </button>
          </form>
        </ConsolePanel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Policy rules">
          <h3 className={appOverline}>Active rules</h3>
          {rules.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No policy rules yet"
                description="Define enforceable thresholds before automation expands."
                ctas={[{ href: "#rule-name", label: "Add first rule" }]}
              />
            </div>
          ) : (
            <ul className={`mt-3 space-y-2 ${appBody}`}>
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-foreground/90">{rule.ruleName}</p>
                    <p className={appMeta}>
                      Min MFA: {rule.minMfaCoveragePercent ?? "n/a"}% ·{" "}
                      {rule.blockHighRiskWithoutApproval ? "approval required" : "advisory"} ·{" "}
                      {rule.enabled ? "enabled" : "disabled"}
                    </p>
                  </div>
                  <form action={deleteAccessRuleAction}>
                    <input type="hidden" name="id" value={rule.id} />
                    <button type="submit" className={`font-medium text-danger hover:underline ${appMeta}`}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>

        <ConsolePanel title="Recent posture snapshots">
          <h3 className={appOverline}>Latest snapshots</h3>
          {snapshots.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No snapshots recorded"
                description="Ingest posture telemetry from your identity platform to guide risk decisions."
              />
            </div>
          ) : (
            <ul className={`mt-3 space-y-2 ${appBody}`}>
              {snapshots.map((snap) => (
                <li key={snap.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <p className="font-medium text-foreground/90">{new Date(snap.capturedAt).toLocaleString()}</p>
                  <p className={appMeta}>
                    MFA: {snap.mfaCoveragePercent ?? "n/a"}% · Privileged:{" "}
                    {snap.privilegedAccountsMfaEnabled ?? "n/a"}/{snap.privilegedAccountsTotal ?? "n/a"} ·
                    Stale: {snap.stalePrivilegedAccounts ?? "n/a"}
                  </p>
                  {snap.sourceSystem ? <p className={appMeta}>Source: {snap.sourceSystem}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>
      </div>
    </>
  );
}
