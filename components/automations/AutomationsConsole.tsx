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
      const j = (await r.json()) as {
        ok?: boolean;
        detail?: string;
        error?: string;
        id?: string;
        at?: string;
        persisted?: boolean;
      };
      if (!r.ok) {
        setMsg(j.error ?? "Dry-run failed");
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
            : "Dry-run saved (issues detected) — see robot health and Audit."
          : j.ok
            ? "Dry-run recorded for this session."
            : "Dry-run completed with issues — see robot health.",
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {msg ? (
        <p className="shynvo-glass-subtle rounded-xl px-4 py-3 text-sm leading-relaxed text-muted">
          {msg}
        </p>
      ) : null}
      <div className="shynvo-table-wrap">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.03] font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            <tr>
              <th className="px-4 py-3.5">Playbook</th>
              <th className="px-4 py-3.5">Environment</th>
              <th className="px-4 py-3.5">Last dry-run</th>
              <th className="px-4 py-3.5">Risk</th>
              <th className="px-4 py-3.5 w-36" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-white/[0.03]">
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
                    className="rounded-lg border border-white/[0.1] bg-white/[0.02] px-2.5 py-1 text-xs font-medium text-muted transition-[border-color,background-color,color,box-shadow] hover:border-accent/35 hover:text-foreground hover:shadow-[0_0_20px_-10px_rgba(94,225,255,0.25)] disabled:opacity-50"
                  >
                    {busyId === row.id ? "Running…" : "Dry-run"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="shynvo-glass rounded-2xl p-5 md:p-6">
        <h2 className="text-sm font-semibold text-foreground/90">Recent dry-runs</h2>
        {runs.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] px-4 py-8 text-center text-sm text-muted">
            No dry-runs yet. Pick a playbook above and run <strong className="text-foreground/85">Dry-run</strong>{" "}
            — results persist to your audit trail when the deployment is configured for it.
          </p>
        ) : (
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs text-muted">
            {runs.slice(0, 12).map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-0.5 border-b border-white/[0.05] pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2"
              >
                <span className="font-mono text-foreground/85">{r.playbookId}</span>
                <span className="flex shrink-0 items-center gap-2 sm:justify-end">
                  <span className={r.ok ? "text-emerald-400/90" : "text-amber-400/90"}>
                    {r.ok ? "ok" : "fail"}
                  </span>
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
    </div>
  );
}
