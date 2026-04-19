import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { listIncidentsForUser } from "@/lib/incidents/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Incidents",
  description: "Active and recent incidents with timelines.",
};

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  let userId: string | null = null;
  let devTenantKey: string | null = null;
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/incidents");
    }
    userId = user.id;
  } else {
    devTenantKey = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
  }

  const { source, rows } = await listIncidentsForUser(userId ?? "", devTenantKey);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          className="min-w-0 flex-1"
          title="Incidents"
          description="Unified view of signals, ownership, and timeline entries. With Supabase configured and the incidents migration applied, rows load from your database."
        />
        <Link
          href="/incidents/new"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)]"
        >
          New incident
        </Link>
      </div>
      {source === "session" ? (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          Incidents are scoped to this browser session until Supabase is connected. Run{" "}
          <code className="rounded bg-surface px-1 font-mono text-accent">
            supabase/migrations/20260418130000_incidents.sql
          </code>{" "}
          and sign in for account-wide, persistent incidents.
        </p>
      ) : null}
      <div className="shynvo-table-wrap">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.03] font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            <tr>
              <th className="px-4 py-3.5">Id</th>
              <th className="px-4 py-3.5">Title</th>
              <th className="px-4 py-3.5">Service</th>
              <th className="px-4 py-3.5">Owner</th>
              <th className="px-4 py-3.5">Runbook</th>
              <th className="px-4 py-3.5">Severity</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
                  No incidents yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 font-mono text-xs text-accent">
                    <Link href={`/incidents/${row.id}`} className="hover:underline">
                      {row.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">{row.title}</td>
                  <td className="px-4 py-3 text-muted">
                    {row.serviceName ? (
                      <span className="text-foreground/85">{row.serviceName}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-3 text-muted">
                    {row.ownerHint ? (
                      <span className="text-foreground/85">{row.ownerHint}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[12rem] truncate px-4 py-3 text-muted">
                    {row.runbookSlug ? (
                      <Link
                        href={`/runbooks/${row.runbookSlug}`}
                        className="text-accent hover:underline"
                      >
                        {row.runbookTitle ?? row.runbookSlug}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted">{row.severity}</td>
                  <td className="px-4 py-3 capitalize text-muted">{row.status}</td>
                  <td className="px-4 py-3 text-muted">{row.updated}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
