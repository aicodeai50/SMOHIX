import Link from "next/link";

import { AuditWhisperInline } from "@/components/guardrails/AuditWhisperInline";
import { ExecutionBadge } from "@/components/guardrails/ExecutionBadge";
import { ExecutionOutcomeBadge } from "@/components/guardrails/ExecutionOutcomeBadge";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import type { OverviewCommandCenterData } from "@/lib/overview/command-center-data";
import { mCardMotion } from "@/lib/marketing-layout";

import type { IncidentRow } from "@/lib/incidents/types";

const statusCell =
  "block rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/25 hover:bg-white/[0.04] hover:shadow-[0_16px_48px_-28px_rgba(0,0,0,0.45)] focus-visible:ring-2 focus-visible:ring-accent/35";

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
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100/95">
            Attention needed
          </h2>
          {command.attentionGroups.length > 0 ? (
            <ExecutionBadge tone="warn" title="One card per problem area — start with the primary action">
              {command.attentionGroups.length} group
              {command.attentionGroups.length === 1 ? "" : "s"}
            </ExecutionBadge>
          ) : (
            <ExecutionBadge tone="success" title="Nothing urgent in this snapshot">
              Clear
            </ExecutionBadge>
          )}
        </div>
        {command.attentionGroups.length === 0 ? (
          <p className={`mt-3 text-muted ${appBody}`}>
            No urgent checklist items in this snapshot. Keep connectors healthy and approvals
            flowing so this stays green.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {command.attentionGroups.map((g) => (
              <li
                key={`${g.kind}-${g.id}`}
                className={`rounded-xl border border-white/[0.1] bg-white/[0.04] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ${mCardMotion}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200/80">
                      {g.kind === "incident"
                        ? "Incident"
                        : g.kind === "approvals"
                          ? "Approvals"
                          : "Workspace"}
                    </p>
                    <h3 className={`mt-1 ${appPanelTitle} text-foreground/95`}>{g.title}</h3>
                    {g.subtitle ? (
                      <p className={`mt-0.5 ${appMeta}`}>{g.subtitle}</p>
                    ) : null}
                    <ul className={`mt-3 list-disc space-y-1.5 pl-4 text-foreground/85 ${appBody}`}>
                      {g.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                    {g.lastActivityLabel ? (
                      <p className={`mt-3 font-medium text-foreground/80 ${appMeta}`}>{g.lastActivityLabel}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    <Link
                      href={g.primaryAction.href}
                      className={`inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-background transition-opacity hover:opacity-90 ${appBody}`}
                    >
                      {g.primaryAction.label}
                    </Link>
                  </div>
                </div>
                {g.secondaryLinks?.length ? (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.08] pt-3">
                    {g.secondaryLinks.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={`font-medium text-accent hover:underline ${appMeta}`}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="smohix-glass rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className={`${appPanelTitle} text-foreground/95`}>Pending approvals</h2>
            <Link href="/approvals" className={`font-medium text-accent hover:underline ${appMeta}`}>
              Open queue →
            </Link>
          </div>
          {command.pendingCount === 0 ? (
            <p className={`mt-3 text-muted ${appBody}`}>Nothing waiting for a human decision.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {command.pendingApprovals.map((p) => (
                <li key={p.id} className="list-none">
                  <Link
                    href="/approvals"
                    className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent/25 hover:bg-white/[0.04] hover:shadow-[0_0_28px_-16px_rgba(94,225,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`font-medium text-foreground/90 ${appBody}`}>{p.action}</p>
                        <p className={`mt-0.5 ${appMeta}`}>
                          Requested by {p.requestedBy}
                          {p.policy && p.policy !== "—" ? ` · ${p.policy}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 font-semibold text-accent ${appMeta}`}>Review →</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="smohix-glass rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className={`${appPanelTitle} text-foreground/95`}>Last platform action</h2>
            <Link href="/audit" className={`font-medium text-accent hover:underline ${appMeta}`}>
              Audit log →
            </Link>
          </div>
          {command.lastAuditWhisper ? (
            <div className="mt-4">
              <AuditWhisperInline whisper={command.lastAuditWhisper} />
            </div>
          ) : (
            <p className={`mt-3 text-muted ${appBody}`}>
              Sign in with Supabase and append audit events to see the latest trust signal here.
            </p>
          )}
        </section>
      </div>

      <section className="smohix-glass rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className={`${appPanelTitle} text-foreground/95`}>Recent execution activity</h2>
          <Link href="/automations" className={`font-medium text-accent hover:underline ${appMeta}`}>
            Automations →
          </Link>
        </div>
        {command.recentDryRuns.length === 0 ? (
          <p className={`mt-3 text-muted ${appBody}`}>No dry-runs recorded in this workspace yet.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {command.recentDryRuns.map((r) => (
              <li
                key={r.id}
                className={`flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] pb-2.5 last:border-0 last:pb-0 ${appBody} transition-colors hover:bg-white/[0.02]`}
              >
                <span className={`font-mono text-foreground/85 ${appMeta}`}>{r.playbookId}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <ExecutionOutcomeBadge
                    ok={r.ok}
                    robotConfigured={command.robotEnvConfigured}
                    title="Heuristic from robot URL presence and dry-run health check"
                  />
                  <span className={appMeta}>
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

      <section className="smohix-glass rounded-2xl p-5 md:p-6">
        <h2 className={`${appPanelTitle} text-foreground/95`}>System status</h2>
        <p className={`mt-1 ${appMeta}`}>Product-level signals — not infrastructure metrics.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          <li className="list-none">
            <Link href="/audit" className={statusCell}>
              <span className="text-muted">Audit logging</span>
              <p className={`mt-1 font-medium capitalize text-foreground/90 ${appBody}`}>{governance.auditTrail}</p>
            </Link>
          </li>
          <li className="list-none">
            <Link href="/approvals" className={statusCell}>
              <span className="text-muted">Approvals queue</span>
              <p className={`mt-1 font-medium capitalize text-foreground/90 ${appBody}`}>
                {governance.approvalsQueue === "active" ? "Database-backed" : "Session dev store"}
              </p>
            </Link>
          </li>
          <li className="list-none">
            <Link href="/settings/connectors" className={statusCell}>
              <span className="text-muted">Connectors</span>
              <p className={`mt-1 font-medium text-foreground/90 ${appBody}`}>
                {governance.connectors.reachable}/{governance.connectors.total} reachable ·{" "}
                {governance.connectors.configured}/{governance.connectors.total} configured
              </p>
            </Link>
          </li>
          <li className="list-none">
            <Link href="/automations" className={statusCell}>
              <span className="text-muted">Automation console</span>
              <p className={`mt-1 font-medium text-foreground/90 ${appBody}`}>
                {governance.automationsConsole === "paid" && "Paid / unlocked"}
                {governance.automationsConsole === "free_blocked" && "Blocked on free tier"}
                {governance.automationsConsole === "dev_session" && "Session mode (no account DB)"}
              </p>
            </Link>
          </li>
        </ul>
      </section>

      <section className="smohix-glass rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className={`${appPanelTitle} text-foreground/95`}>Recent incidents</h2>
          <Link href="/incidents" className={`font-medium text-accent hover:underline ${appMeta}`}>
            All incidents →
          </Link>
        </div>
        {recentIncidents.length === 0 ? (
          <p className={`mt-3 text-muted ${appBody}`}>
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
              <li
                key={row.id}
                className="rounded-xl py-3 pl-2 pr-2 first:pt-0 transition-[background-color,border-color] duration-200 hover:bg-white/[0.03]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/incidents/${row.id}`}
                    className={`min-w-0 flex-1 rounded-lg font-medium text-foreground/90 outline-none ring-offset-2 ring-offset-background transition-colors hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/35 ${appBody}`}
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
                <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 ${appMeta}`}>
                  <span>Updated {row.updated}</span>
                  {row.ownerHint ? (
                    <span className="text-foreground/75">Owner {row.ownerHint}</span>
                  ) : (
                    <span className="text-amber-200/80">No owner set</span>
                  )}
                  {row.runbookSlug ? (
                    <Link href={`/runbooks/${row.runbookSlug}`} className="text-accent hover:underline">
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
