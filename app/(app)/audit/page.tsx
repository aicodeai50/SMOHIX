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
      {source === "demo" && hasSupabaseAuth() && userId ? (
        <p className="mb-4 rounded-lg border border-border bg-surface-elevated/50 px-3 py-2 text-xs text-muted">
          Showing <span className="font-medium text-foreground/90">sample entries</span>. After
          Supabase is set up, run{" "}
          <code className="rounded bg-surface px-1 font-mono text-accent">
            supabase/migrations/20260418140000_console_extensions.sql
          </code>{" "}
          so events append to your <span className="font-mono">audit_log</span>.
        </p>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/80 font-mono text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Time (UTC)</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                  No audit events yet.
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="hover:bg-surface-elevated/40">
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
