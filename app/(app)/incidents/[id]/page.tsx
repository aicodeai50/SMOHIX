import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  updateIncidentContextAction,
  updateIncidentPostmortemAction,
  updateIncidentStatusAction,
} from "./actions";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { AuditWhisperInline } from "@/components/guardrails/AuditWhisperInline";
import { ExecutionOutcomeBadge } from "@/components/guardrails/ExecutionOutcomeBadge";
import { getLatestAuditWhisperForIncident } from "@/lib/audit/whispers";
import { getLatestDryRunForIncident } from "@/lib/automations/dry-runs-db";
import type { DryRunRecord } from "@/lib/automations/runs-dev";
import { getIncidentForUser } from "@/lib/incidents/data";
import { listRunbooks } from "@/lib/runbooks/catalog";
import { getIncidentTimeline } from "@/lib/incidents/timeline";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Incident ${id}`,
  };
}

export default async function IncidentDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;

  let userId = "";
  let devTenantKey: string | null = null;
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
    }
    userId = user.id;
  } else {
    devTenantKey = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
  }

  const resolved = await getIncidentForUser(userId, id, devTenantKey);
  if (!resolved) {
    notFound();
  }

  const { row, source } = resolved;
  const runbooks = listRunbooks();

  const timeline = await getIncidentTimeline({
    source,
    userId,
    incidentId: id,
    devTenantKey,
  });

  const auditWhisper =
    hasSupabaseAuth() && userId && source === "database"
      ? await getLatestAuditWhisperForIncident(userId, id)
      : null;

  const automationHref =
    source === "database" && hasSupabaseAuth()
      ? `/automations?incident=${encodeURIComponent(id)}`
      : "/automations";

  const robotConnectorConfigured = Boolean(process.env.SHYNVO_ROBOT_API_URL?.trim());

  let lastIncidentDryRun: DryRunRecord | null = null;
  if (hasSupabaseAuth() && userId && source === "database") {
    const supabase = await createServerSupabaseClient();
    lastIncidentDryRun = await getLatestDryRunForIncident(supabase, userId, id);
  }

  return (
    <>
      {source === "session" ? (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          Session-scoped incident. The timeline below records opens and status changes from this
          browser session; connect Supabase and integrations for shared history and external
          events.
        </p>
      ) : (
        <p className="shynvo-glass-subtle mb-4 rounded-xl px-4 py-3 text-xs leading-relaxed text-muted">
          Timeline entries come from your <span className="font-mono">audit_log</span> (status and
          owner/runbook updates) when the service role can append audits.
        </p>
      )}
      <PageHeader
        title={row.title}
        description={`${row.id} · ${row.severity} · ${row.status} · updated ${row.updated}${
          row.serviceName ? ` · ${row.serviceName}` : ""
        }${row.ownerHint ? ` · ${row.ownerHint}` : ""}`}
      />
      {lastIncidentDryRun ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Last dry-run (this incident)
            </p>
            <p className="mt-1 font-mono text-sm text-foreground/90">{lastIncidentDryRun.playbookId}</p>
            <p className="mt-0.5 text-xs text-muted">
              {new Date(lastIncidentDryRun.at).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ExecutionOutcomeBadge
              ok={lastIncidentDryRun.ok}
              robotConfigured={robotConnectorConfigured}
              title="From stored dry-run result and robot connector configuration"
            />
            <Link
              href={automationHref}
              className="text-xs font-medium text-accent hover:underline"
            >
              Open automations →
            </Link>
          </div>
        </div>
      ) : null}
      {auditWhisper ? (
        <div className="mb-4">
          <AuditWhisperInline whisper={auditWhisper} />
        </div>
      ) : hasSupabaseAuth() && source === "database" ? (
        <p className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-muted">
          No audit events linked to this incident yet.{" "}
          <Link href={automationHref} className="font-medium text-accent hover:underline">
            Run a contextual dry-run
          </Link>{" "}
          to attach automation evidence with this incident id.
        </p>
      ) : null}
      {source === "database" && row.serviceId ? (
        <p className="mb-4 text-sm text-muted">
          Linked service:{" "}
          <Link href="/services" className="font-medium text-accent hover:underline">
            {row.serviceName ?? "Open catalog"}
          </Link>
        </p>
      ) : null}
      {row.runbookSlug ? (
        <p className="mb-4 text-sm text-muted">
          Linked runbook:{" "}
          <Link
            href={`/runbooks/${row.runbookSlug}`}
            className="font-medium text-accent hover:underline"
          >
            {row.runbookTitle ?? row.runbookSlug}
          </Link>
        </p>
      ) : null}
      {source === "database" && hasSupabaseAuth() ? (
        <p className="mb-4 text-sm">
          <a
            href={`/api/incidents/${encodeURIComponent(row.id)}/export`}
            className="font-medium text-accent hover:underline"
          >
            Download markdown export
          </a>
          <span className="ml-2 text-xs text-muted">for status pages or postmortem archives</span>
        </p>
      ) : null}
      {err ? (
        <p className="mb-4 rounded-xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/90 backdrop-blur-sm">
          {err}
        </p>
      ) : null}
      {(source === "database" && hasSupabaseAuth()) ||
      (source === "session" && !hasSupabaseAuth()) ? (
        <form
          id="incident-context"
          action={updateIncidentContextAction}
          className="shynvo-glass mb-6 space-y-4 rounded-2xl p-4 md:p-5"
        >
          <input type="hidden" name="id" value={row.id} />
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Owner & runbook</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[12rem] flex-1">
              <label htmlFor="owner_hint" className="mb-1 block text-xs font-medium text-muted">
                Owner / on-call
              </label>
              <input
                id="owner_hint"
                name="owner_hint"
                maxLength={200}
                defaultValue={row.ownerHint ?? ""}
                placeholder="@oncall"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-foreground outline-none ring-accent/25 focus:border-accent/40 focus:ring-2"
              />
            </div>
            <div className="min-w-[14rem] flex-1">
              <label htmlFor="runbook_slug" className="mb-1 block text-xs font-medium text-muted">
                Runbook
              </label>
              <select
                id="runbook_slug"
                name="runbook_slug"
                defaultValue={row.runbookSlug ?? ""}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-foreground outline-none ring-accent/25 focus:border-accent/40 focus:ring-2"
              >
                <option value="">— None —</option>
                {runbooks.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-10 shrink-0 rounded-xl bg-accent px-5 text-sm font-semibold text-background hover:opacity-95"
            >
              Save context
            </button>
          </div>
        </form>
      ) : null}
      {(source === "database" && hasSupabaseAuth()) ||
      (source === "session" && !hasSupabaseAuth()) ? (
        <form
          id="incident-status"
          action={updateIncidentStatusAction}
          className="shynvo-glass mb-6 flex flex-wrap items-end gap-3 rounded-2xl p-4 md:p-5"
        >
          <input type="hidden" name="id" value={row.id} />
          <div>
            <label htmlFor="status" className="mb-1 block text-xs font-medium text-muted">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={row.status}
              className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-foreground outline-none ring-accent/25 focus:border-accent/40 focus:ring-2"
            >
              <option value="investigating">Investigating</option>
              <option value="mitigated">Mitigated</option>
              <option value="resolved">Resolved</option>
              <option value="monitoring">Monitoring</option>
            </select>
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)]"
          >
            Save status
          </button>
        </form>
      ) : null}
      {source === "database" && hasSupabaseAuth() ? (
        <PlaceholderCard title="Postmortem & notes">
          <form action={updateIncidentPostmortemAction} className="space-y-3">
            <input type="hidden" name="id" value={row.id} />
            <label htmlFor="postmortem" className="block text-xs font-medium text-muted">
              Blameless summary, timeline, root cause, action items
            </label>
            <textarea
              id="postmortem"
              name="postmortem"
              rows={10}
              maxLength={24000}
              defaultValue={row.postmortem ?? ""}
              placeholder="What happened, what we learned, what we will change…"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground outline-none ring-accent/25 focus:border-accent/40 focus:ring-2"
            />
            <button
              type="submit"
              className="h-10 rounded-xl bg-accent px-5 text-sm font-semibold text-background hover:opacity-95"
            >
              Save notes
            </button>
          </form>
        </PlaceholderCard>
      ) : null}
      <PlaceholderCard title="Timeline">
        {timeline.length === 0 ? (
          <ConsoleEmptyState
            title="No events recorded yet"
            description={
              source === "database"
                ? "Saves and automation runs append here when audit logging is available. Use the steps below so this incident does not stall."
                : "This session has not recorded timeline events yet. Actions you take below will show up here when auditing is wired for session mode."
            }
            ctas={[
              { href: automationHref, label: "Run a dry-run automation" },
              ...(source === "database" && hasSupabaseAuth()
                ? [{ href: "#postmortem", label: "Add a note", variant: "secondary" as const }]
                : []),
              { href: "#incident-status", label: "Update status", variant: "secondary" },
              { href: "#incident-context", label: "Attach a runbook", variant: "secondary" },
              { href: "/audit", label: "Open audit log", variant: "secondary" },
            ]}
          />
        ) : (
          <ul className="space-y-3 font-mono text-sm">
            {timeline.map((e, i) => (
              <li
                key={`${e.at}-${i}-${e.label.slice(0, 24)}`}
                className="flex gap-4 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
              >
                <span className="shrink-0 text-xs text-muted">{e.at} UTC</span>
                <span className="text-foreground/90">{e.label}</span>
              </li>
            ))}
          </ul>
        )}
      </PlaceholderCard>
    </>
  );
}
