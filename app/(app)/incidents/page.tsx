import type { Metadata } from "next";
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
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/incidents");
    }
    userId = user.id;
  }

  const { source, rows } = await listIncidentsForUser(userId ?? "");

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          className="min-w-0 flex-1"
          title="Incidents"
          description="Unified view of signals, ownership, and timeline entries. With Supabase configured and the incidents migration applied, rows load from your database."
        />
        {hasSupabaseAuth() && userId ? (
          <Link
            href="/incidents/new"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-background hover:opacity-90"
          >
            New incident
          </Link>
        ) : null}
      </div>
      {source === "demo" ? (
        <p className="mb-4 rounded-lg border border-border bg-surface-elevated/50 px-3 py-2 text-xs text-muted">
          Showing <span className="font-medium text-foreground/90">demo incidents</span>. After
          Supabase is set up, run{" "}
          <code className="rounded bg-surface px-1 font-mono text-accent">
            supabase/migrations/20260418130000_incidents.sql
          </code>{" "}
          to use real data.
        </p>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/80 font-mono text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Id</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                  No incidents yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-elevated/40">
                  <td className="px-4 py-3 font-mono text-xs text-accent">
                    <Link href={`/incidents/${row.id}`} className="hover:underline">
                      {row.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">{row.title}</td>
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
