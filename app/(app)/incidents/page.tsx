import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { StateBeacon } from "@/components/architecture";
import { appBody, appMeta } from "@/lib/app-typography";
import { incidentSeverityBeacon, incidentStatusBeacon } from "@/lib/architecture/ops-state";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { listIncidentsForUser } from "@/lib/incidents/data";
import { getOrgContextForUser } from "@/lib/org/context";
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
  let activeOrgId: string | null = null;
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/incidents");
    }
    userId = user.id;
    const orgContext = await getOrgContextForUser(user.id);
    activeOrgId = orgContext.orgId;
  } else {
    devTenantKey = ((await cookies()).get("smohix_dev_tid")?.value ?? (await cookies()).get("zentro_dev_tid")?.value) ?? "anon";
  }

  const { source, rows } = await listIncidentsForUser(userId ?? "", devTenantKey, activeOrgId);
  const ambient = await loadConsoleAmbientSnapshot({ context: "incidents" });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          className="min-w-0 flex-1"
          eyebrow="Operations"
          title="Incidents"
          description="Unified view of signals, ownership, and timeline entries. With Supabase configured and the incidents migration applied, rows load from your database."
        />
        <Link
          href="/incidents/new"
          className={`inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-accent px-5 font-semibold text-background shadow-[0_0_20px_-10px_rgba(16,185,129,0.4)] transition-opacity hover:opacity-95 ${appBody}`}
        >
          New incident
        </Link>
      </div>
      <ConsoleAmbientBanner snapshot={ambient} />
      {source === "session" ? (
        <p className={`smohix-glass-subtle mb-4 rounded-xl px-4 py-3 ${appMeta}`}>
          Incidents are currently scoped to this browser session. Sign in to a configured workspace
          for shared, persistent incident history and team visibility.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <ConsoleEmptyState
          title="No incidents yet"
          description={
            source === "database"
              ? "Create an incident from Services when burn looks wrong, or open one manually — then move through automations, approvals, runbooks, Copilot, and audit from the incident page."
              : "Session mode keeps incidents in this browser only. Sign in with Supabase for a shared, persistent queue."
          }
          ctas={[
            { href: "/incidents/new", label: "Create incident" },
            ...(source === "database"
              ? ([
                  { href: "/services", label: "Start from a service", variant: "secondary" as const },
                  { href: "/settings", label: "Alert ingest & tokens", variant: "secondary" as const },
                ] as const)
              : ([
                  {
                    href: "/auth/sign-in?next=/incidents",
                    label: "Sign in for database",
                    variant: "secondary" as const,
                  },
                ] as const)),
          ]}
        />
      ) : (
      <div className="smohix-table-wrap">
        <table className={`w-full text-left ${appBody}`}>
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
            {rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-white/[0.03]"
                >
                  <td className={`px-4 py-3 font-mono text-accent ${appMeta}`}>
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
                  <td className="px-4 py-3">
                    <StateBeacon {...incidentSeverityBeacon(row.severity)} />
                  </td>
                  <td className="px-4 py-3">
                    <StateBeacon {...incidentStatusBeacon(row.status)} />
                  </td>
                  <td className="px-4 py-3 text-muted">{row.updated}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}
