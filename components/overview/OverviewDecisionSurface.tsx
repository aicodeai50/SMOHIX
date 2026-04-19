import Link from "next/link";

import { AuditWhisperInline } from "@/components/guardrails/AuditWhisperInline";
import { ExecutionBadge } from "@/components/guardrails/ExecutionBadge";
import { ExecutionOutcomeBadge } from "@/components/guardrails/ExecutionOutcomeBadge";
import type { OverviewCommandCenterData } from "@/lib/overview/command-center-data";

import type { IncidentRow } from "@/lib/incidents/types";

export function OverviewDecisionSurface({
  command,
  recentIncidents,
}: {
  command: OverviewCommandCenterData;
  recentIncidents: IncidentRow[];
}) {
  const { governance } = command;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-5 md:p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-100/95">
            Attention needed
          </h2>
          {command.attention.length > 0 ? (
            <ExecutionBadge tone="warn" title="Resolve these before they become incidents">
              {command.attention.length} item{command.attention.length === 1 ? "" : "s"}
            </ExecutionBadge>
          ) : (
            <ExecutionBadge tone="success" title="Nothing urgent in this snapshot">
              Clear
            </ExecutionBadge>
          )}
        </div>
        {command.attention.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            No urgent checklist items in this snapshot. Keep connectors healthy and approvals
            flowing so this stays green.
          </p>
        ) : (
          <ul className="mt-4 space-y-2.5 text-sm">
            {command.attention.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-start gap-2 rounded-lg py-1 text-foreground/90 transition-colors hover:text-accent"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/90" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="shynvo-glass rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground/95">Pending approvals</h2>
            <Link href="/approvals" className="text-xs font-medium text-accent hover:underline">
              Open queue →
            </Link>
          </div>
          {command.pendingCount === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing waiting for a human decision.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {command.pendingApprovals.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground/90">{p.action}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Requested by {p.requestedBy}
                        {p.policy && p.policy !== "—" ? ` · ${p.policy}` : ""}
                      </p>
                    </div>
                    <Link
                      href="/approvals"
                      className="shrink-0 text-xs font-semibold text-accent hover:underline"
                    >
                      Review →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="shynvo-glass rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground/95">Last platform action</h2>
            <Link href="/audit" className="text-xs font-medium text-accent hover:underline">
              Audit log →
            </Link>
          </div>
          {command.lastAuditWhisper ? (
            <div className="mt-4">
              <AuditWhisperInline whisper={command.lastAuditWhisper} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Sign in with Supabase and append audit events to see the latest trust signal here.
            </p>
          )}
        </section>
      </div>

      <section className="shynvo-glass rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground/95">Recent execution activity</h2>
          <Link href="/automations" className="text-xs font-medium text-accent hover:underline">
            Automations →
          </Link>
        </div>
        {command.recentDryRuns.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No dry-runs recorded in this workspace yet.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {command.recentDryRuns.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-2.5 text-sm last:border-0 last:pb-0"
              >
                <span className="font-mono text-xs text-foreground/85">{r.playbookId}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <ExecutionOutcomeBadge
                    ok={r.ok}
                    robotConfigured={command.robotEnvConfigured}
                    title="Heuristic from robot URL presence and dry-run health check"
                  />
                  <span className="text-xs text-muted">
                    {new Date(r.at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="shynvo-glass rounded-2xl p-5 md:p-6">
        <h2 className="text-sm font-semibold text-foreground/95">System status</h2>
        <p className="mt-1 text-xs text-muted">
          Product-level signals — not infrastructure metrics.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm">
            <span className="text-muted">Audit logging</span>
            <p className="mt-1 font-medium capitalize text-foreground/90">{governance.auditTrail}</p>
          </li>
          <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm">
            <span className="text-muted">Approvals queue</span>
            <p className="mt-1 font-medium capitalize text-foreground/90">
              {governance.approvalsQueue === "active" ? "Database-backed" : "Session dev store"}
            </p>
          </li>
          <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm">
            <span className="text-muted">Connectors</span>
            <p className="mt-1 font-medium text-foreground/90">
              {governance.connectors.reachable}/{governance.connectors.total} reachable ·{" "}
              {governance.connectors.configured}/{governance.connectors.total} configured
            </p>
          </li>
          <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm">
            <span className="text-muted">Automation console</span>
            <p className="mt-1 font-medium text-foreground/90">
              {governance.automationsConsole === "paid" && "Paid / unlocked"}
              {governance.automationsConsole === "free_blocked" && "Blocked on free tier"}
              {governance.automationsConsole === "dev_session" && "Session mode (no account DB)"}
            </p>
          </li>
        </ul>
      </section>

      <section className="shynvo-glass rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground/95">Recent incidents</h2>
          <Link href="/incidents" className="text-xs font-medium text-accent hover:underline">
            All incidents →
          </Link>
        </div>
        {recentIncidents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No incidents yet.{" "}
            <Link href="/incidents/new" className="font-medium text-accent hover:underline">
              Create one
            </Link>{" "}
            or open{" "}
            <Link href="/incidents" className="font-medium text-accent hover:underline">
              Incidents
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {recentIncidents.map((row) => (
              <li key={row.id} className="py-3 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/incidents/${row.id}`}
                    className="min-w-0 flex-1 font-medium text-foreground/90 hover:text-accent"
                  >
                    <span className="line-clamp-2">{row.title}</span>
                  </Link>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <ExecutionBadge tone="muted" title="Severity">
                      {row.severity}
                    </ExecutionBadge>
                    <ExecutionBadge tone="info" title="Workflow status">
                      {row.status}
                    </ExecutionBadge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span>Updated {row.updated}</span>
                  {row.ownerHint ? (
                    <span className="text-foreground/75">Owner {row.ownerHint}</span>
                  ) : (
                    <span className="text-amber-200/80">No owner set</span>
                  )}
                  {row.runbookSlug ? (
                    <Link
                      href={`/runbooks/${row.runbookSlug}`}
                      className="text-accent hover:underline"
                    >
                      Runbook linked
                    </Link>
                  ) : (
                    <span className="text-amber-200/80">No runbook</span>
                  )}
                  {row.serviceName ? <span>Service {row.serviceName}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
