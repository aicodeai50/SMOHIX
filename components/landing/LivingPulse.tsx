"use client";

import { useEffect, useState } from "react";

const PHASES = [
  { label: "DIMENSION", value: "ONLINE" },
  { label: "INGEST", value: "READY" },
  { label: "GUARDRAILS", value: "ENFORCED" },
  { label: "AUDIT", value: "APPEND-ONLY" },
  { label: "ASCENSION", value: "GLOWING" },
] as const;

export function LivingPulse() {
  const [index, setIndex] = useState(0);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const rotate = window.setInterval(() => {
      setIndex((i) => (i + 1) % PHASES.length);
    }, 3200);
    return () => window.clearInterval(rotate);
  }, []);

  useEffect(() => {
    const beat = window.setInterval(() => setPulse((v) => !v), 900);
    return () => window.clearInterval(beat);
  }, []);

  const phase = PHASES[index]!;

  return (
    <div
      className="zentro-living-pulse zentro-ascension-badge mb-6 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-full border border-white/[0.08] bg-black/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] backdrop-blur-md"
      aria-live="polite"
    >
      <span className="flex items-center gap-2 text-[#6ee7b7]">
        <span
          className={`zentro-pulse-dot inline-block h-2 w-2 rounded-full bg-[#6ee7b7] ${pulse ? "opacity-100" : "opacity-40"}`}
        />
        Live
      </span>
      <span className="text-muted/50" aria-hidden>
        ·
      </span>
      <span className="text-accent transition-opacity duration-500">{phase.label}</span>
      <span className="text-foreground/80">{phase.value}</span>
    </div>
  );
}
