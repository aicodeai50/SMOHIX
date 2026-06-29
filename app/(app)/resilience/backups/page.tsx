import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline, appPanelTitle } from "@/lib/app-typography";
import { listBackupPoliciesForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { createBackupPolicyAction, deleteBackupPolicyAction } from "./actions";

export const metadata: Metadata = {
  title: "Backup readiness",
  description: "Backup policy inventory with RPO/RTO expectations.",
};

export const dynamic = "force-dynamic";

export default async function BackupsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Backup readiness"
          description="Connect Supabase and sign in to manage backup policies and restore posture."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>Local mode does not persist backup policy records.</p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/resilience/backups");
  }

  const rows = await listBackupPoliciesForUser(user.id);
  const enabledCount = rows.filter((r) => r.enabled).length;
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Resilience"
        title="Backup readiness"
        description="Track policy scope and retention targets so incidents can validate DR posture quickly."
      />
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="zentro-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Policies tracked</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{rows.length}</p>
        </div>
        <div className="zentro-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Enabled</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{enabledCount}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Add backup policy">
          <form action={createBackupPolicyAction} className="space-y-3">
            <div>
              <label htmlFor="bp-name" className={`mb-1 block ${appLabel}`}>
                Policy name
              </label>
              <input
                id="bp-name"
                name="name"
                required
                maxLength={200}
                placeholder="production-postgres-nightly"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="bp-scope" className={`mb-1 block ${appLabel}`}>
                Asset scope
              </label>
              <input
                id="bp-scope"
                name="asset_scope"
                maxLength={200}
                placeholder="db:payments-prod"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="bp-rpo" className={`mb-1 block ${appLabel}`}>
                  RPO (min)
                </label>
                <input
                  id="bp-rpo"
                  name="rpo_target_minutes"
                  type="number"
                  min={0}
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="bp-rto" className={`mb-1 block ${appLabel}`}>
                  RTO (min)
                </label>
                <input
                  id="bp-rto"
                  name="rto_target_minutes"
                  type="number"
                  min={0}
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="bp-retention" className={`mb-1 block ${appLabel}`}>
                  Retention (days)
                </label>
                <input
                  id="bp-retention"
                  name="retention_days"
                  type="number"
                  min={0}
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="bp-owner" className={`mb-1 block ${appLabel}`}>
                Owner hint
              </label>
              <input
                id="bp-owner"
                name="owner_hint"
                maxLength={200}
                placeholder="Team: Data Platform"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add policy
            </button>
          </form>
        </ConsolePanel>

        <ConsolePanel title="Policy inventory">
          <h3 className={appOverline}>Registered policies</h3>
          {rows.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No backup policies yet"
                description="Define policy ownership and targets so responders can quickly assess restore readiness."
                ctas={[{ href: "#bp-name", label: "Add first policy" }]}
              />
            </div>
          ) : (
            <ul className={`mt-3 space-y-2 ${appBody}`}>
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-foreground/90">{row.name}</p>
                    <p className={appMeta}>
                      {row.assetScope ?? "scope n/a"} · {row.enabled ? "enabled" : "disabled"}
                    </p>
                    {row.ownerHint ? <p className={appMeta}>Owner: {row.ownerHint}</p> : null}
                  </div>
                  <form action={deleteBackupPolicyAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className={`font-medium text-danger hover:underline ${appMeta}`}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <p className={`mt-4 ${appMeta}`}>
            <span className={appPanelTitle}>Next:</span> add backup runs and restore test logs through APIs
            or import jobs so this module can score stale backup risk automatically.
          </p>
        </ConsolePanel>
      </div>
    </>
  );
}
