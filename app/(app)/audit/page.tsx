import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { listAuditEntriesForUser } from "@/lib/audit/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Immutable record of actions and approvals.",
};

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  let userId: string | null = null;
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/audit");
    }
    userId = user.id;
  }

  const { source, rows } = await listAuditEntriesForUser(userId);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only trail for billing sync, API keys, and future automation events. Export hooks can build on this table."
      />
      {source === "session" ? (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          Sign in with Supabase auth to load your <span className="font-mono">audit_log</span>{" "}
          entries. The log records billing sync, API key changes, approvals, and other actions.
        </p>
      ) : hasSupabaseAuth() && userId && rows.length === 0 ? (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          No events yet. Ensure{" "}
          <code className="rounded bg-surface px-1 font-mono text-accent">
            supabase/migrations/20260418140000_console_extensions.sql
          </code>{" "}
          is applied and <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> is set so the
          app can append audit rows.
        </p>
      ) : null}
      <div className="shynvo-table-wrap">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.03] font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            <tr>
              <th className="px-4 py-3.5">Time (UTC)</th>
              <th className="px-4 py-3.5">Actor</th>
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Details</th>
              <th className="px-4 py-3.5">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] font-mono text-xs">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted">
                  No audit events yet.
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-muted">{e.ts}</td>
                  <td className="px-4 py-3 text-foreground">{e.actor}</td>
                  <td className="px-4 py-3 text-accent">{e.action}</td>
                  <td className="max-w-md truncate px-4 py-3 text-muted" title={e.target}>
                    {e.target}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{e.outcome}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
