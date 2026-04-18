import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { approvalDecisionAction } from "./actions";
import { PageHeader } from "@/components/app/PageHeader";
import { listApprovalsForUser } from "@/lib/approvals/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Approvals",
  description: "Pending and recent approval decisions.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ApprovalsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const errQ = typeof sp.error === "string" ? sp.error : undefined;

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
        description="Human-in-the-loop gates for destructive or high-blast-radius changes. Approve or deny pending items; completed decisions appear in Recent."
      />
      {errQ ? (
        <p className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200/90">
          {errQ === "no_demo_session" && "Reload the page so a demo session cookie is set."}
          {errQ === "not_found" && "That approval is no longer pending."}
          {errQ === "update_failed" && "Could not update (check you own this row and it is still pending)."}
        </p>
      ) : null}
      {source === "demo" ? (
        <p className="mb-4 rounded-lg border border-border bg-surface-elevated/50 px-3 py-2 text-xs text-muted">
          {hasSupabaseAuth() ? (
            <>
              Showing <span className="font-medium text-foreground/90">demo approvals</span>. Run{" "}
              <code className="rounded bg-surface px-1 font-mono text-accent">
                supabase/migrations/20260418140000_console_extensions.sql
              </code>{" "}
              for database-backed queues.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground/90">Demo session</span> — decisions are
              kept in server memory for your browser. Connect Supabase for shared, durable queues.
            </>
          )}
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="text-sm font-semibold text-amber-200/90">Pending</h2>
          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No pending approvals.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-border bg-background/60 p-4"
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
                        className="w-full rounded-md border border-border py-2 text-xs font-medium text-foreground transition-colors hover:border-red-500/40 hover:text-red-200"
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
        <section className="rounded-xl border border-border bg-surface/80 p-5">
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
                  className="rounded-lg border border-border/80 bg-background/40 px-3 py-2"
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
