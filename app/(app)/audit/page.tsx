import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { AuditIntentTags } from "@/components/guardrails/AuditIntentTags";
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
        description="Append-only log for billing sync, API keys, approvals, and automation events. Export hooks can build on this table."
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
      {rows.length === 0 ? (
        <ConsoleEmptyState
          title={source === "session" ? "Sign in to see audit history" : "No audit events yet"}
          description={
            source === "session"
              ? "The audit log is stored per account in Supabase. Sign in to load append-only events."
              : "When the service role can append, status changes, API keys, billing sync, and automation events appear here."
          }
          ctas={
            source === "session"
              ? [{ href: "/auth/sign-in?next=/audit", label: "Sign in" }]
              : [
                  { href: "/approvals", label: "Open approvals", variant: "secondary" },
                  { href: "/automations", label: "Run a dry-run" },
                ]
          }
          footnote={
            source === "session" ? null : (
              <>
                Apply{" "}
                <code className="rounded bg-surface px-1 font-mono text-accent">
                  supabase/migrations/20260418140000_console_extensions.sql
                </code>{" "}
                and set <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> for append paths.
              </>
            )
          }
        />
      ) : (
      <div className="shynvo-table-wrap">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.03] font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            <tr>
              <th className="px-4 py-3.5">Time (UTC)</th>
              <th className="px-4 py-3.5">Actor</th>
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Details</th>
              <th className="px-4 py-3.5">Intent</th>
              <th className="px-4 py-3.5">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] font-mono text-xs">
            {rows.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-muted">{e.ts}</td>
                  <td className="px-4 py-3 text-foreground">{e.actor}</td>
                  <td className="px-4 py-3 text-accent">{e.action}</td>
                  <td className="max-w-md truncate px-4 py-3 text-muted" title={e.target}>
                    {e.target}
                  </td>
                  <td className="px-4 py-3 font-sans text-[11px]">
                    {e.incidentId ? (
                      <Link
                        href={`/incidents/${encodeURIComponent(e.incidentId)}`}
                        className="text-accent hover:underline"
                      >
                        View incident
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top font-sans text-[11px]">
                    <AuditIntentTags tags={e.tags} />
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{e.outcome}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}
