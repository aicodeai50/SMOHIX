import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { approvalDecisionAction, createApprovalRequestAction } from "./actions";
import { PageHeader } from "@/components/app/PageHeader";
import { listApprovalsForUser } from "@/lib/approvals/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Approvals",
  description: "Pending and recent approval decisions.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ error?: string; message?: string; created?: string }>;
};

export default async function ApprovalsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const errQ = typeof sp.error === "string" ? sp.error : undefined;
  const msgQ = typeof sp.message === "string" ? sp.message : undefined;
  const createdOk = sp.created === "1";

  let userId = "";
  let devTenantId: string | null = null;

  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/approvals");
    }
    userId = user.id;
  } else {
    devTenantId = (await cookies()).get("shynvo_dev_tid")?.value ?? null;
  }

  const { source, pending, recent } = await listApprovalsForUser({
    userId: userId || "local",
    devTenantId,
  });

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Human-in-the-loop gates for destructive or high-blast-radius changes. Open a new request below, then approve or deny pending items; completed decisions appear in Recent."
      />
      {createdOk ? (
        <p className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-100/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          Approval request created and is pending decision.
        </p>
      ) : null}
      {errQ ? (
        <p className="mb-4 rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-xs text-red-200/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
          {errQ === "no_session" && "Reload the page so a browser session cookie is set."}
          {errQ === "not_found" && "That approval is no longer pending."}
          {errQ === "update_failed" && "Could not update (check you own this row and it is still pending)."}
          {errQ === "create" && (msgQ ?? "Could not create the request.")}
        </p>
      ) : null}
      {source === "session" ? (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          Approvals are scoped to this browser session (server memory +{" "}
          <span className="font-mono">shynvo_dev_tid</span>). Connect Supabase and run{" "}
          <code className="rounded bg-surface px-1 font-mono text-accent">
            supabase/migrations/20260418140000_console_extensions.sql
          </code>{" "}
          for a shared <span className="font-mono">approval_requests</span> queue.
        </p>
      ) : hasSupabaseAuth() && pending.length === 0 && recent.length === 0 ? (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          No rows in <span className="font-mono">approval_requests</span> yet. Use the form below or
          your API/automation to enqueue work.
        </p>
      ) : null}
      <section className="shynvo-glass mb-6 rounded-2xl p-5 md:p-6">
        <h2 className="text-sm font-semibold text-foreground/95">New approval request</h2>
        <p className="mt-1 text-xs text-muted">
          Describe the change. Optional fields help reviewers apply the right policy.
        </p>
        <form action={createApprovalRequestAction} className="mt-4 max-w-2xl space-y-4">
          <div>
            <label htmlFor="action_label" className="mb-1.5 block text-xs font-medium text-muted">
              Action <span className="text-red-400/90">*</span>
            </label>
            <input
              id="action_label"
              name="action_label"
              required
              maxLength={500}
              placeholder="e.g. Promote canary to production — svc/checkout"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-foreground outline-none ring-accent/25 transition-[border-color,box-shadow] focus:border-accent/40 focus:ring-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="requested_by" className="mb-1.5 block text-xs font-medium text-muted">
                Requested by
              </label>
              <input
                id="requested_by"
                name="requested_by"
                maxLength={200}
                placeholder="Team or username"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-foreground outline-none ring-accent/25 transition-[border-color,box-shadow] focus:border-accent/40 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="policy_hint" className="mb-1.5 block text-xs font-medium text-muted">
                Policy / risk note
              </label>
              <input
                id="policy_hint"
                name="policy_hint"
                maxLength={500}
                placeholder="e.g. Two-person rule, change window only"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-foreground outline-none ring-accent/25 transition-[border-color,box-shadow] focus:border-accent/40 focus:ring-2"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)]"
          >
            Submit request
          </button>
        </form>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-amber-400/15 bg-amber-500/[0.06] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md md:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200/90">Pending</h2>
          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No pending approvals.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-[border-color,box-shadow] hover:border-amber-400/20 hover:shadow-[0_0_24px_-14px_rgba(251,191,36,0.15)]"
                >
                  <p className="font-mono text-xs text-muted">{p.id}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{p.action}</p>
                  <p className="mt-1 text-xs text-muted">
                    {p.requestedBy} · {p.policy}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <form action={approvalDecisionAction} className="flex-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button
                        type="submit"
                        className="w-full rounded-md bg-emerald-600/90 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={approvalDecisionAction} className="flex-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="decision" value="denied" />
                      <button
                        type="submit"
                        className="w-full rounded-lg border border-white/[0.1] bg-white/[0.02] py-2 text-xs font-medium text-foreground transition-[border-color,color] hover:border-red-400/35 hover:text-red-200"
                      >
                        Deny
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="shynvo-glass rounded-2xl p-5 md:p-6">
          <h2 className="text-sm font-semibold text-muted">Recent</h2>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No completed decisions yet. Use{" "}
              <Link href="/settings" className="text-accent hover:underline">
                Settings
              </Link>{" "}
              for connectors and billing.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground/90">{r.action}</span>
                    <span
                      className={
                        r.status === "approved"
                          ? "text-xs font-medium text-emerald-400/90"
                          : "text-xs font-medium text-red-300/90"
                      }
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted">{r.id}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
