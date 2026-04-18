"use client";

import { useMemo, useState } from "react";

import { PLAYBOOKS } from "@/lib/automations/playbooks";
import type { DryRunRecord } from "@/lib/automations/runs-dev";

function labelFromRuns(runs: DryRunRecord[], playbookId: string): string {
  const hit = runs.find((r) => r.playbookId === playbookId);
  if (!hit) {
    return "—";
  }
  const status = hit.ok ? "ok" : "fail";
  const t = new Date(hit.at);
  return `${status} · ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function AutomationsConsole({ initialRuns }: { initialRuns: DryRunRecord[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      PLAYBOOKS.map((p) => ({
        ...p,
        lastRun: labelFromRuns(runs, p.id),
      })),
    [runs],
  );

  async function dryRun(playbookId: string) {
    setBusyId(playbookId);
    setMsg(null);
    try {
      const r = await fetch("/api/automations/dry-run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playbookId }),
      });
      const j = (await r.json()) as { ok?: boolean; detail?: string; error?: string };
      if (!r.ok) {
        setMsg(j.error ?? "Dry-run failed");
        return;
      }
      setRuns((prev) => {
        const entry: DryRunRecord = {
          id: `run-${Date.now()}`,
          playbookId,
          ok: Boolean(j.ok),
          detail: j.detail ?? "",
          at: new Date().toISOString(),
        };
        return [entry, ...prev].slice(0, 40);
      });
      setMsg(j.ok ? "Dry-run recorded." : "Dry-run completed with issues — see robot health.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {msg ? (
        <p className="rounded-lg border border-border bg-surface-elevated/50 px-3 py-2 text-sm text-muted">
          {msg}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/80 font-mono text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Playbook</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Last dry-run</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3 w-36" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-surface-elevated/40">
                <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-3 capitalize text-muted">{row.env}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{row.lastRun}</td>
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
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void dryRun(row.id)}
                    className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-50"
                  >
                    {busyId === row.id ? "Running…" : "Dry-run"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {runs.length > 0 ? (
        <section className="rounded-xl border border-border bg-surface/80 p-5">
          <h2 className="text-sm font-semibold text-muted">Recent dry-runs</h2>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto font-mono text-xs text-muted">
            {runs.slice(0, 12).map((r) => (
              <li key={r.id} className="flex justify-between gap-2 border-b border-border/40 pb-2">
                <span className="text-foreground/80">{r.playbookId}</span>
                <span className={r.ok ? "text-emerald-400/90" : "text-amber-400/90"}>
                  {r.ok ? "ok" : "fail"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
