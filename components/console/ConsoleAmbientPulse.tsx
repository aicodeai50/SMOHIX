"use client";

import { useEffect, useState } from "react";

import type { ConsoleAmbientHealth, ConsoleAmbientPhase } from "@/lib/console/ambient-status";

const HEALTH_LABEL: Record<ConsoleAmbientHealth, string> = {
  nominal: "Operational",
  attention: "Attention",
  critical: "Critical",
};

const HEALTH_DOT: Record<ConsoleAmbientHealth, string> = {
  nominal: "bg-[#6ee7b7]",
  attention: "bg-amber-400",
  critical: "bg-danger",
};

export function ConsoleAmbientPulse({
  health,
  phases,
}: {
  health: ConsoleAmbientHealth;
  phases: ConsoleAmbientPhase[];
}) {
  const [index, setIndex] = useState(0);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (phases.length <= 1) return undefined;
    const rotate = window.setInterval(() => {
      setIndex((i) => (i + 1) % phases.length);
    }, 3200);
    return () => window.clearInterval(rotate);
  }, [phases.length]);

  useEffect(() => {
    const beat = window.setInterval(() => setPulse((v) => !v), 900);
    return () => window.clearInterval(beat);
  }, []);

  const phase = phases[index] ?? phases[0] ?? { label: "STATUS", value: "—" };

  return (
    <div
      className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-full border border-white/[0.08] bg-black/35 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] backdrop-blur-md"
      aria-live="polite"
    >
      <span className="flex items-center gap-2 text-foreground/90">
        <span
          className={`inline-block h-2 w-2 rounded-full ${HEALTH_DOT[health]} ${pulse ? "opacity-100" : "opacity-45"}`}
        />
        {HEALTH_LABEL[health]}
      </span>
      <span className="text-muted/50" aria-hidden>
        ·
      </span>
      <span className="text-accent transition-opacity duration-500">{phase.label}</span>
      <span className="normal-case tracking-normal text-foreground/80">{phase.value}</span>
    </div>
  );
}
