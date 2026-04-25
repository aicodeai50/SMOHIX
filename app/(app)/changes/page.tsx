import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { appBody, appLabel, appMeta, appOverline } from "@/lib/app-typography";
import { listChangeActionsForUser, listChangeWindowsForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  createChangeActionAction,
  createChangeWindowAction,
  deleteChangeWindowAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Changes",
  description: "Change windows and execution logs for safer operational rollout.",
};

export const dynamic = "force-dynamic";

export default async function ChangesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Changes"
          description="Connect Supabase and sign in to manage maintenance windows and change execution logs."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>Local mode does not persist change calendar records.</p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/changes");
  }

  const [windows, actions] = await Promise.all([
    listChangeWindowsForUser(user.id),
    listChangeActionsForUser(user.id),
  ]);
  const nowMs = new Date().valueOf();
  const upcoming = windows.filter((w) => new Date(w.endsAt).valueOf() >= nowMs).length;

  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Changes"
        description="Schedule maintenance windows, classify risk, and track executed change actions with audit visibility."
      />
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="shynvo-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Scheduled windows</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{windows.length}</p>
        </div>
        <div className="shynvo-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Upcoming / active</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{upcoming}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderCard title="Create change window">
          <form action={createChangeWindowAction} className="space-y-3">
            <div>
              <label htmlFor="cw-title" className={`mb-1 block ${appLabel}`}>
                Title
              </label>
              <input
                id="cw-title"
                name="title"
                required
                maxLength={200}
                placeholder="Prod database patch window"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="cw-start" className={`mb-1 block ${appLabel}`}>
                  Starts at
                </label>
                <input
                  id="cw-start"
                  name="starts_at"
                  type="datetime-local"
                  required
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="cw-end" className={`mb-1 block ${appLabel}`}>
                  Ends at
                </label>
                <input
                  id="cw-end"
                  name="ends_at"
                  type="datetime-local"
                  required
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="cw-env" className={`mb-1 block ${appLabel}`}>
                  Environment
                </label>
                <input
                  id="cw-env"
                  name="environment"
                  maxLength={120}
                  placeholder="production"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="cw-risk" className={`mb-1 block ${appLabel}`}>
                  Risk
                </label>
                <select
                  id="cw-risk"
                  name="risk_level"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                >
                  <option value="low">Low</option>
                  <option value="medium" defaultChecked>
                    Medium
                  </option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label htmlFor="cw-owner" className={`mb-1 block ${appLabel}`}>
                  Owner hint
                </label>
                <input
                  id="cw-owner"
                  name="owner_hint"
                  maxLength={200}
                  placeholder="DBA on-call"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <label className={`inline-flex items-center gap-2 ${appBody}`}>
              <input
                type="checkbox"
                name="requires_approval"
                defaultChecked
                className="h-4 w-4 rounded border-border bg-background"
              />
              Requires explicit approval
            </label>
            <div>
              <label htmlFor="cw-notes" className={`mb-1 block ${appLabel}`}>
                Notes
              </label>
              <textarea
                id="cw-notes"
                name="notes"
                rows={3}
                maxLength={4000}
                placeholder="Rollback plan and impacted services..."
                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add window
            </button>
          </form>
        </PlaceholderCard>

        <PlaceholderCard title="Log change action">
          <form action={createChangeActionAction} className="space-y-3">
            <div>
              <label htmlFor="ca-window" className={`mb-1 block ${appLabel}`}>
                Change window
              </label>
              <select
                id="ca-window"
                name="change_window_id"
                required
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              >
                <option value="">Select window…</option>
                {windows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ca-type" className={`mb-1 block ${appLabel}`}>
                  Action type
                </label>
                <input
                  id="ca-type"
                  name="action_type"
                  required
                  maxLength={120}
                  placeholder="patch.apply"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="ca-status" className={`mb-1 block ${appLabel}`}>
                  Status
                </label>
                <select
                  id="ca-status"
                  name="status"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                >
                  <option value="planned">Planned</option>
                  <option value="executed">Executed</option>
                  <option value="rolled_back">Rolled back</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ca-target" className={`mb-1 block ${appLabel}`}>
                  Target reference
                </label>
                <input
                  id="ca-target"
                  name="target_ref"
                  maxLength={300}
                  placeholder="svc:payments-api"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
              <div>
                <label htmlFor="ca-exec" className={`mb-1 block ${appLabel}`}>
                  Executed at
                </label>
                <input
                  id="ca-exec"
                  name="executed_at"
                  type="datetime-local"
                  className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                />
              </div>
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Log action
            </button>
          </form>
        </PlaceholderCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PlaceholderCard title="Scheduled windows">
          <h3 className={appOverline}>Calendar entries</h3>
          {windows.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No change windows"
                description="Add your first maintenance window before recording actions."
                ctas={[{ href: "#cw-title", label: "Create first window" }]}
              />
            </div>
          ) : (
            <ul className={`mt-3 space-y-2 ${appBody}`}>
              {windows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-foreground/90">{row.title}</p>
                    <p className={appMeta}>
                      {new Date(row.startsAt).toLocaleString()} → {new Date(row.endsAt).toLocaleString()}
                    </p>
                    <p className={appMeta}>
                      {row.environment ?? "env n/a"} · {row.riskLevel} risk ·{" "}
                      {row.requiresApproval ? "approval required" : "approval optional"}
                    </p>
                  </div>
                  <form action={deleteChangeWindowAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className={`font-medium text-danger hover:underline ${appMeta}`}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </PlaceholderCard>

        <PlaceholderCard title="Recent change actions">
          <h3 className={appOverline}>Execution log</h3>
          {actions.length === 0 ? (
            <div className="mt-4">
              <ConsoleEmptyState
                title="No change actions logged"
                description="Log executed and rolled-back actions to build operational evidence."
              />
            </div>
          ) : (
            <ul className={`mt-3 space-y-2 ${appBody}`}>
              {actions.map((row) => (
                <li key={row.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                  <p className="font-medium text-foreground/90">{row.actionType}</p>
                  <p className={appMeta}>
                    {row.status} · window {row.changeWindowId.slice(0, 8)} · target {row.targetRef ?? "n/a"}
                  </p>
                  {row.executedAt ? (
                    <p className={appMeta}>Executed: {new Date(row.executedAt).toLocaleString()}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </PlaceholderCard>
      </div>
    </>
  );
}
