"use client";

import { useEffect, useState } from "react";

const FEED = [
  { tone: "text-accent", text: "◈ ingest · webhook collapsed into incident #8841" },
  { tone: "text-[#c4b5fd]", text: "◈ surface · 3 critical paths on auth-api" },
  { tone: "text-[#6ee7b7]", text: "◈ guard · approval gate · rollback armed" },
  { tone: "text-warning", text: "◈ exposure · cert api-gateway expires in 12d" },
  { tone: "text-accent", text: "◈ audit · append-only · governance.staffing_sla_*" },
  { tone: "text-[#6ee7b7]", text: "◈ execute · dry-run passed · awaiting operator" },
] as const;

const METRICS = [
  { label: "Incidents", value: "12", spark: "↓ 3" },
  { label: "Exposure", value: "2", spark: "crit" },
  { label: "Approvals", value: "5", spark: "queue" },
  { label: "Audit 24h", value: "1.2k", spark: "live" },
] as const;

const REGIONS = ["us-east", "eu-west", "ap-south", "global"] as const;

export function FutureCommandCore() {
  const [lineIndex, setLineIndex] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
  const [regionIndex, setRegionIndex] = useState(0);
  const [health, setHealth] = useState(99.97);

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

  useEffect(() => {
    const dim = window.setInterval(() => {
      setRegionIndex((i) => (i + 1) % REGIONS.length);
      setHealth(99.9 + Math.random() * 0.09);
    }, 4000);
    return () => window.clearInterval(dim);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div
        className="smohix-orbit-ring pointer-events-none absolute -right-10 -top-10 h-44 w-44 opacity-70"
        aria-hidden
      />
      <div
        className="smohix-orbit-ring pointer-events-none absolute -left-6 bottom-8 h-28 w-28 opacity-40"
        style={{ animationDirection: "reverse", animationDuration: "32s" }}
        aria-hidden
      />
      <div className="smohix-quantum-core smohix-neural-field smohix-holo-panel relative overflow-hidden rounded-2xl p-1">
        <div className="smohix-scan-sweep pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="smohix-dimension-rift pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        <div className="relative rounded-[calc(1rem-4px)] bg-[#040508]/95 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="smohix-pulse-dot inline-block h-2 w-2 rounded-full bg-[#6ee7b7]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Live command
              </span>
            </div>
            <span className="font-mono text-[10px] text-accent/90">
              {REGIONS[regionIndex]} · {health.toFixed(2)}% health
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label} className="smohix-bento-cell smohix-cell-breathe rounded-lg px-3 py-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
                  {m.label}
                </p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-foreground">{m.value}</p>
                <p className="font-mono text-[9px] text-accent/80">{m.spark}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/50 p-3 font-mono text-[11px] leading-relaxed">
            <p className="text-muted/90">
              <span className="text-accent">⟨</span> smohix watch --live
            </p>
            {FEED.slice(0, 4).map((line, i) => (
              <p
                key={line.text}
                className={`mt-1.5 transition-opacity duration-500 ${i === lineIndex % 4 ? "opacity-100" : "opacity-30"} ${line.tone}`}
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
                className={`smohix-cell-breathe h-8 rounded border border-white/[0.06] ${
                  i === 1 || i === 5
                    ? "bg-[var(--danger-dim)] shadow-[inset_0_0_20px_-8px_var(--danger)]"
                    : i === 4
                      ? "bg-[var(--accent-dim)] shadow-[inset_0_0_24px_-6px_var(--accent-glow)]"
                      : "bg-white/[0.03]"
                }`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] text-muted/70">
        Command console preview — sign in for your org
      </p>
    </div>
  );
}
