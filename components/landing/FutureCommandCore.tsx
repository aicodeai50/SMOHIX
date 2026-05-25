"use client";

import { useEffect, useState } from "react";

const FEED = [
  { tone: "text-accent", text: "ingest · datadog webhook → incident #8841 opened" },
  { tone: "text-[#c4b5fd]", text: "surface · 3 critical deps on auth-api cluster" },
  { tone: "text-[#6ee7b7]", text: "guard · approval pending · rollback playbook" },
  { tone: "text-warning", text: "exposure · cert api-gateway expires 12d" },
  { tone: "text-accent", text: "audit · append-only governance.staffing_sla_*" },
  { tone: "text-[#6ee7b7]", text: "execute · dry-run passed · awaiting owner" },
] as const;

const METRICS = [
  { label: "Incidents", value: "12", spark: "↓ 3" },
  { label: "Exposure", value: "2", spark: "crit" },
  { label: "Approvals", value: "5", spark: "queue" },
  { label: "Audit 24h", value: "1.2k", spark: "live" },
] as const;

export function FutureCommandCore() {
  const [lineIndex, setLineIndex] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % FEED.length);
    }, 2800);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const blink = window.setInterval(() => setCursorOn((v) => !v), 530);
    return () => window.clearInterval(blink);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div
        className="zentro-orbit-ring pointer-events-none absolute -right-8 -top-8 h-40 w-40 opacity-60"
        aria-hidden
      />
      <div className="zentro-neural-field zentro-holo-panel relative overflow-hidden rounded-2xl p-1">
        <div className="zentro-scan-sweep pointer-events-none absolute inset-0 opacity-40" aria-hidden />

        <div className="relative rounded-[calc(1rem-4px)] bg-[#06070b]/95 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="zentro-pulse-dot inline-block h-2 w-2 rounded-full bg-[#6ee7b7]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Neural command
              </span>
            </div>
            <span className="font-mono text-[10px] text-accent/90">zentro.run · SOC</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label} className="zentro-bento-cell rounded-lg px-3 py-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
                  {m.label}
                </p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-foreground">{m.value}</p>
                <p className="font-mono text-[9px] text-accent/80">{m.spark}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/40 p-3 font-mono text-[11px] leading-relaxed">
            <p className="text-muted/90">
              <span className="text-accent">$</span> zentro watch --stream
            </p>
            {FEED.slice(0, 4).map((line, i) => (
              <p
                key={line.text}
                className={`mt-1.5 transition-opacity duration-500 ${i === lineIndex % 4 ? "opacity-100" : "opacity-35"} ${line.tone}`}
              >
                {line.text}
              </p>
            ))}
            <p className="mt-2 text-foreground/70">
              <span className={cursorOn ? "opacity-100" : "opacity-0"}>▌</span>
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden>
            {[...Array(9)].map((_, i) => (
              <span
                key={i}
                className={`h-8 rounded border border-white/[0.06] ${
                  i === 1 || i === 5
                    ? "bg-[var(--danger-dim)] shadow-[inset_0_0_20px_-8px_var(--danger)]"
                    : i === 4
                      ? "bg-[var(--accent-dim)] shadow-[inset_0_0_20px_-8px_var(--accent-glow)]"
                      : "bg-white/[0.03]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] text-muted/70">
        Illustrative command surface — live data after sign-in
      </p>
    </div>
  );
}
