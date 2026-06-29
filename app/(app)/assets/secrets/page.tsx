import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { listSecretsForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { createSecretAction, deleteSecretAction } from "./actions";

export const metadata: Metadata = {
  title: "Secrets",
  description: "Track secret rotation cadence and ownership.",
};

export const dynamic = "force-dynamic";

export default async function SecretsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Secrets"
          description="Connect Supabase and sign in to manage secret inventory and rotation posture."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>Local mode does not persist secrets inventory.</p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/assets/secrets");
  }

  const rows = await listSecretsForUser(user.id);
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title="Secrets"
        description="Track secret rotation policy and upcoming rotations across environments."
      />
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Add secret record">
          <form action={createSecretAction} className="space-y-3">
            <div>
              <label htmlFor="secret-name" className={`mb-1 block ${appLabel}`}>
                Name
              </label>
              <input
                id="secret-name"
                name="name"
                required
                maxLength={200}
                placeholder="robot-api-token"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="secret-type" className={`mb-1 block ${appLabel}`}>
                  Type
                </label>
                <select
                  id="secret-type"
                  name="secret_type"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                >
                  <option value="api_key">API key</option>
                  <option value="token">Token</option>
                  <option value="password">Password</option>
                  <option value="cert_key">Certificate key</option>
                </select>
              </div>
              <div>
                <label htmlFor="secret-env" className={`mb-1 block ${appLabel}`}>
                  Environment
                </label>
                <input
                  id="secret-env"
                  name="environment"
                  maxLength={120}
                  placeholder="production"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="secret-rotation" className={`mb-1 block ${appLabel}`}>
                  Rotation days
                </label>
                <input
                  id="secret-rotation"
                  name="rotation_policy_days"
                  type="number"
                  min={1}
                  placeholder="90"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="secret-last" className={`mb-1 block ${appLabel}`}>
                  Last rotated
                </label>
                <input
                  id="secret-last"
                  name="last_rotated_at"
                  type="datetime-local"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="secret-next" className={`mb-1 block ${appLabel}`}>
                  Next rotation
                </label>
                <input
                  id="secret-next"
                  name="next_rotate_at"
                  type="datetime-local"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="secret-owner" className={`mb-1 block ${appLabel}`}>
                Owner hint
              </label>
              <input
                id="secret-owner"
                name="owner_hint"
                maxLength={200}
                placeholder="Team: Security"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="secret-notes" className={`mb-1 block ${appLabel}`}>
                Notes
              </label>
              <textarea
                id="secret-notes"
                name="notes"
                rows={3}
                maxLength={4000}
                placeholder="Rotation runbook and storage reference..."
                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add secret
            </button>
          </form>
        </ConsolePanel>

        <ConsolePanel title="Rotation queue">
          <h3 className={appOverline}>Tracked secrets</h3>
          {rows.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No secrets tracked"
                description="Store rotation metadata so governance and audits can prove secret hygiene."
                ctas={[{ href: "#secret-name", label: "Add first secret" }]}
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
                      {row.secretType} · {row.environment ?? "n/a"} · every {row.rotationPolicyDays}d
                    </p>
                    <p className={appMeta}>
                      Next rotation: {row.nextRotateAt ? new Date(row.nextRotateAt).toLocaleString() : "not set"}
                    </p>
                  </div>
                  <form action={deleteSecretAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className={`font-medium text-danger hover:underline ${appMeta}`}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </ConsolePanel>
      </div>
    </>
  );
}
