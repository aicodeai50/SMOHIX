"use client";

import { useEffect, useMemo, useState } from "react";

import { appMeta, appPanelTitle } from "@/lib/app-typography";

type PolicyBlockWindow = "7d" | "30d";

type PolicyBlockSummary = {
  window: PolicyBlockWindow;
  count: number;
  priorCount: number;
  delta: number;
  topReasonCode: string | null;
  topReasonLabel: string | null;
  distribution: { code: string; label: string; count: number }[];
};

type ApiPayload = { summary: PolicyBlockSummary };

export function PolicyBlockAnalyticsPanel() {
  const [window, setWindow] = useState<PolicyBlockWindow>("7d");
  const [summary, setSummary] = useState<PolicyBlockSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });
    void fetch(`/api/governance/policy-blocks/summary?window=${window}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `Request failed (${r.status})`);
        }
        return (await r.json()) as ApiPayload;
      })
      .then((j) => {
        if (cancelled) return;
        setSummary(j.summary);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load policy block analytics.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [window]);

  const deltaLabel = useMemo(() => {
    if (!summary) return "—";
    if (summary.priorCount === 0) return "No prior baseline";
    if (summary.delta === 0) return "No change";
    return summary.delta > 0 ? `+${summary.delta} vs prior` : `${summary.delta} vs prior`;
  }, [summary]);

  return (
    <section className="zentro-glass mb-4 rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={appPanelTitle}>Policy block analytics</h2>
        <div className="flex items-center gap-2">
          {(["7d", "30d"] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindow(w)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                window === w
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-white/[0.14] text-foreground/75 hover:border-accent/35 hover:text-foreground"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className={`mt-3 ${appMeta} text-muted`}>Loading analytics…</p>
      ) : error ? (
        <p className={`mt-3 rounded-xl border border-danger/45 bg-danger-dim/35 px-4 py-3 ${appMeta} text-danger`}>
          Could not load policy-block analytics: {error}
        </p>
      ) : summary ? (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <p className={appMeta}>Blocks ({summary.window})</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{summary.count}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <p className={appMeta}>Change vs prior</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{deltaLabel}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <p className={appMeta}>Top reason</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {summary.topReasonLabel ?? "No policy blocks in window"}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            <p className={appMeta}>Reason distribution</p>
            {summary.distribution.length === 0 ? (
              <p className={`mt-1 ${appMeta} text-muted`}>No blocked executions in this window.</p>
            ) : (
              <ul className={`mt-1 space-y-1 ${appMeta}`}>
                {summary.distribution.map((d) => (
                  <li key={d.code} className="flex items-center justify-between gap-3">
                    <span className="text-foreground/90">{d.label}</span>
                    <span className="font-mono text-foreground/75">{d.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <p className={`mt-3 ${appMeta} text-muted`}>No data available.</p>
      )}
    </section>
  );
}
