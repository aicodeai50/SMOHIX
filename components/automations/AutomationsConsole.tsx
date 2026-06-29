"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AuditWhisperInline } from "@/components/guardrails/AuditWhisperInline";
import { ExecutionBadge } from "@/components/guardrails/ExecutionBadge";
import { ExecutionOutcomeBadge } from "@/components/guardrails/ExecutionOutcomeBadge";
import { ExecutionModeCallout } from "@/components/guardrails/ExecutionModeCallout";
import { GuardedAutomationIdentity } from "@/components/guardrails/GuardedAutomationIdentity";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { PLAYBOOKS } from "@/lib/automations/playbooks";
import type { ExecutionReceipt } from "@/lib/automations/executions-dev";
import type { AuditWhisper } from "@/lib/audit/whispers";
import type { DryRunRecord } from "@/lib/automations/runs-dev";
import type { PolicySuggestion } from "@/lib/decision-intelligence";

function labelFromRuns(runs: DryRunRecord[], playbookId: string): string {
  const hit = runs.find((r) => r.playbookId === playbookId);
  if (!hit) {
    return "—";
  }
  const status = hit.ok ? "ok" : "fail";
  const t = new Date(hit.at);
  return `${status} · ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function AutomationsConsole({
  initialRuns,
  initialExecutions,
  auditTrailOnDryRun,
  auditWhisper,
  robotConnectorConfigured,
  linkedIncidentId,
}: {
  initialRuns: DryRunRecord[];
  initialExecutions: ExecutionReceipt[];
  auditTrailOnDryRun: boolean;
  auditWhisper: AuditWhisper | null;
  robotConnectorConfigured: boolean;
  linkedIncidentId: string | null;
}) {
  const [runs, setRuns] = useState(initialRuns);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [executions, setExecutions] = useState<ExecutionReceipt[]>(initialExecutions);
  const [promotedSuggestionIds, setPromotedSuggestionIds] = useState<Set<string>>(new Set());

  const rows = useMemo(
    () =>
      PLAYBOOKS.map((p) => ({
        ...p,
        lastRun: labelFromRuns(runs, p.id),
      })),
    [runs],
  );

  async function dryRun(playbookId: string) {
    const confirmed = window.confirm(
      "Run this dry-run? This validates the automation path without applying production changes. When supported, the result is recorded in your audit history.",
    );
    if (!confirmed) {
      return;
    }
    setBusyId(playbookId);
    setMsg(null);
    try {
      const r = await fetch("/api/automations/dry-run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playbookId,
          ...(linkedIncidentId && auditTrailOnDryRun
            ? { incidentId: linkedIncidentId }
            : {}),
        }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        detail?: string;
        error?: string;
        id?: string;
        at?: string;
        persisted?: boolean;
      };
      if (!r.ok) {
        setMsg(j.error ?? "Dry-run could not be completed. Review configuration and try again.");
        return;
      }
      setRuns((prev) => {
        const entry: DryRunRecord = {
          id: j.id ?? `run-${Date.now()}`,
          playbookId,
          ok: Boolean(j.ok),
          detail: j.detail ?? "",
          at: j.at ?? new Date().toISOString(),
        };
        return [entry, ...prev].slice(0, 40);
      });
      setMsg(
        j.persisted
          ? j.ok
            ? "Dry-run saved and logged to your audit trail."
            : "Dry-run saved with issues detected. Review connector health and audit details."
          : j.ok
            ? "Dry-run recorded for this session."
            : "Dry-run completed with issues. Review connector health before execution.",
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  async function execute(playbookId: string) {
    const approvalNote = window.prompt(
      "Approval note (include reviewers and approved change window):",
      "two-person approval | change window | senior on-call acknowledged",
    );
    if (!approvalNote || !approvalNote.trim()) return;
    const rollbackPlan = window.prompt(
      "Rollback plan (required):",
      "Rollback by restoring previous stable release and validating synthetic checks.",
    );
    if (!rollbackPlan || !rollbackPlan.trim()) return;

    setBusyId(playbookId);
    setMsg(null);
    try {
      const r = await fetch("/api/automations/execute", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playbookId,
          approvalNote,
          rollbackPlan,
          ...(linkedIncidentId && auditTrailOnDryRun
            ? { incidentId: linkedIncidentId }
            : {}),
        }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        id?: string;
        at?: string;
        mode?: "simulated" | "connector";
        detail?: string;
        message?: string;
        error?: string;
        sloPolicy?: {
          burnState?: "healthy" | "warning" | "critical";
          requiresSeniorAcknowledgement?: boolean;
          requiresChangeWindow?: boolean;
        };
        decisionBrief?: ExecutionReceipt["decisionBrief"];
        expectedOutcome?: ExecutionReceipt["expectedOutcome"];
        actualOutcome?: ExecutionReceipt["actualOutcome"];
        decisionAccuracyScore?: number;
        policySuggestions?: PolicySuggestion[];
        changeRisk?: {
          score: number;
          tier: "low" | "medium" | "high" | "critical";
          factors: string[];
        };
      };
      if (!r.ok) {
        const riskHint =
          j.changeRisk && typeof j.changeRisk.score === "number"
            ? ` Risk: ${j.changeRisk.tier} (${j.changeRisk.score}).`
            : "";
        const sloHint =
          j.error === "execution_blocked_by_slo" || j.sloPolicy?.burnState === "critical"
            ? " SLO gate: add 'senior on-call acknowledged' and an explicit 'change window' in the approval note."
            : "";
        setMsg((j.message ?? j.error ?? "Execution blocked.") + riskHint + sloHint);
        return;
      }
      setExecutions((prev) => [
        {
          id: j.id ?? `exec-${Date.now()}`,
          playbookId,
          ok: true,
          at: j.at ?? new Date().toISOString(),
          mode: j.mode ?? "simulated",
          approvalNote,
          rollbackPlan,
          decisionBrief: j.decisionBrief,
          expectedOutcome: j.expectedOutcome,
          actualOutcome: j.actualOutcome,
          decisionAccuracyScore: j.decisionAccuracyScore,
          policySuggestions: j.policySuggestions,
          ...(j.changeRisk ? { changeRisk: j.changeRisk } : {}),
          ...(linkedIncidentId ? { incidentId: linkedIncidentId } : {}),
        },
        ...prev,
      ]);
      setMsg(j.detail ?? "Execution recorded with audit evidence.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Execution request failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function promoteSuggestion(suggestionId: string, playbookId: string, confidence: number) {
    setMsg(null);
    try {
      const r = await fetch("/api/approvals/policy-suggestions/promote", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionId, playbookId, confidence }),
      });
      if (!r.ok) {
        const j = (await r.json()) as { error?: string };
        setMsg(j.error ?? "Failed to promote policy suggestion.");
        return;
      }
      setPromotedSuggestionIds((prev) => {
        const next = new Set(prev);
        next.add(suggestionId);
        return next;
      });
      setMsg("Policy suggestion promoted and logged to audit.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed to promote policy suggestion.");
    }
  }

  return (
    <div className="space-y-6">
      <GuardedAutomationIdentity />
      {linkedIncidentId && auditTrailOnDryRun ? (
        <p className={`rounded-xl border border-accent/25 bg-accent/[0.06] px-4 py-3 text-foreground/90 ${appMeta}`}>
          <span className="font-medium text-foreground">Incident context.</span> Dry-runs started
          here will include{" "}
          <span className="font-mono text-accent/95">{linkedIncidentId}</span> in your audit payload
          so timelines stay traceable.{" "}
          <Link href={`/incidents/${encodeURIComponent(linkedIncidentId)}`} className="text-accent hover:underline">
            Back to incident →
          </Link>
        </p>
      ) : linkedIncidentId && !auditTrailOnDryRun ? (
        <p className={`rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 ${appMeta}`}>
          Incident id is present in the URL, but linking dry-runs to audit requires signing in with
          a workspace where automations are enabled.{" "}
          <Link
            href={`/auth/sign-in?next=${encodeURIComponent(`/automations?incident=${linkedIncidentId}`)}`}
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      ) : null}
      {auditWhisper ? <AuditWhisperInline whisper={auditWhisper} /> : null}
      <ExecutionModeCallout
        requiresApproval
        dryRunAvailable
        auditLogged={auditTrailOnDryRun}
      />
      {msg ? (
        <p className={`zentro-glass-subtle rounded-xl px-4 py-3 ${appBody} text-muted`}>
          {msg}
        </p>
      ) : null}
      <div className="zentro-table-wrap">
        <table className={`w-full text-left ${appBody}`}>
          <thead className="border-b border-white/[0.06] bg-white/[0.03] font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            <tr>
              <th className="px-4 py-3.5">Playbook</th>
              <th className="px-4 py-3.5">Environment</th>
              <th className="px-4 py-3.5">Control</th>
              <th className="px-4 py-3.5">Last dry-run</th>
              <th className="px-4 py-3.5">Risk</th>
              <th className="px-4 py-3.5 w-52" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-3 capitalize text-muted">{row.env}</td>
                <td className="px-4 py-3">
                  <ExecutionBadge tone="info" title="Console playbooks run as dry-runs here">
                    Dry-run only
                  </ExecutionBadge>
                </td>
                <td className={`px-4 py-3 font-mono ${appMeta}`}>{row.lastRun}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.risk === "high"
                        ? "text-amber-400/90"
                        : "text-emerald-400/90"
                    }
                  >
                    {row.risk}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void dryRun(row.id)}
                      className={`rounded-lg border border-white/[0.1] bg-white/[0.02] px-2.5 py-1 font-medium text-muted transition-[border-color,background-color,color,box-shadow] hover:border-accent/35 hover:text-foreground hover:shadow-[0_0_20px_-10px_rgba(94,225,255,0.25)] disabled:opacity-50 ${appMeta}`}
                    >
                      {busyId === row.id ? "Running…" : "Dry-run"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void execute(row.id)}
                      className={`rounded-lg border border-emerald-400/30 bg-emerald-500/[0.08] px-2.5 py-1 font-medium text-emerald-200 transition-[border-color,background-color,color] hover:border-emerald-300/55 hover:bg-emerald-500/[0.14] disabled:opacity-50 ${appMeta}`}
                    >
                      Execute
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="zentro-glass rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={`${appPanelTitle} text-foreground/90`}>Recent dry-runs</h2>
          {auditTrailOnDryRun ? (
            <Link
              href="/audit"
              className={`font-medium text-accent hover:underline ${appMeta}`}
            >
              Last runs in audit →
            </Link>
          ) : null}
        </div>
        {runs.length === 0 ? (
          <p className={`mt-4 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] px-4 py-8 text-center ${appBody} text-muted`}>
            No dry-runs yet. Pick a playbook above and run <strong className="text-foreground/85">Dry-run</strong>{" "}
            — results persist to your audit trail when the deployment is configured for it.
          </p>
        ) : (
          <ul className={`mt-3 max-h-48 space-y-2 overflow-y-auto ${appMeta}`}>
            {runs.slice(0, 12).map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-0.5 border-b border-white/[0.05] pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2"
              >
                <span className="font-mono text-foreground/85">{r.playbookId}</span>
                <span className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <ExecutionOutcomeBadge
                    ok={r.ok}
                    robotConfigured={robotConnectorConfigured}
                    title="From robot connector URL + last health check"
                  />
                  <span className="font-mono text-[10px] opacity-80">
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
      <section className="zentro-glass rounded-2xl p-5 md:p-6">
        <h2 className={`${appPanelTitle} text-foreground/90`}>Recent execution receipts</h2>
        {executions.length === 0 ? (
          <p className={`mt-3 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] px-4 py-6 text-center ${appBody} text-muted`}>
            No executions yet. Run a successful dry-run first, then execute with approval note and rollback plan.
          </p>
        ) : (
          <ul className={`mt-3 space-y-2 ${appMeta}`}>
            {executions.slice(0, 10).map((x) => (
              <li key={x.id} className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                <p className="font-mono text-foreground/90">{x.playbookId}</p>
                <p className="text-foreground/75">
                  {x.mode} · {new Date(x.at).toLocaleString()}
                </p>
                <p className="text-foreground/65">Rollback: {x.rollbackPlan}</p>
                {x.expectedOutcome ? (
                  <p className="text-foreground/65">
                    Expected: {x.expectedOutcome.summary} ({x.expectedOutcome.timeToStableMins}m)
                  </p>
                ) : null}
                {x.actualOutcome ? (
                  <p className="text-foreground/65">
                    Actual: {x.actualOutcome.summary} ({x.actualOutcome.timeToStableMins}m)
                  </p>
                ) : null}
                {typeof x.decisionAccuracyScore === "number" ? (
                  <p className="text-foreground/70">Decision accuracy: {x.decisionAccuracyScore}/100</p>
                ) : null}
                {x.changeRisk ? (
                  <p className="text-foreground/70">
                    Change risk: {x.changeRisk.tier} ({x.changeRisk.score}/100)
                  </p>
                ) : null}
                {x.policySuggestions?.length ? (
                  <div className="mt-2 rounded-md border border-white/[0.08] bg-white/[0.02] p-2">
                    <p className="text-foreground/75">Policy suggestions</p>
                    <ul className="mt-1 space-y-2">
                      {x.policySuggestions.map((s) => (
                        <li key={s.id} className="rounded border border-white/[0.06] p-2">
                          <p className="text-foreground/85">{s.label}</p>
                          <p className="text-foreground/65">{s.reason}</p>
                          <p className="text-foreground/65">Confidence: {s.confidenceScore}</p>
                          <button
                            type="button"
                            disabled={promotedSuggestionIds.has(s.id)}
                            onClick={() => void promoteSuggestion(s.id, x.playbookId, s.confidenceScore)}
                            className={`mt-2 rounded-md border px-2 py-1 text-xs ${
                              promotedSuggestionIds.has(s.id)
                                ? "border-emerald-400/30 bg-emerald-500/[0.1] text-emerald-200"
                                : "border-white/[0.14] bg-white/[0.03] text-foreground/85 hover:border-accent/30"
                            }`}
                          >
                            {promotedSuggestionIds.has(s.id) ? "Promoted" : "Promote to policy review"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
