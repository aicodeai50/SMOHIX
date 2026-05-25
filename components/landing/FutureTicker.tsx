"use client";

const TICKER_ITEMS = [
  "Quantum lattice · Phase coherent",
  "Non-terran origin · Signal bidirectional",
  "Dimension Ω-7 · Command manifold",
  "Guarded execution · Human checkpoint",
  "Append-only audit · Evidence dimension",
  "Incident copilot · Living runbooks",
  "SOC 2 · ISO · FedRAMP · Eight frameworks",
  "Something bigger than any stack alone",
] as const;

export function FutureTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="zentro-future-ticker mt-10 border-t border-white/[0.06] pt-6" aria-hidden>
      <div className="zentro-future-ticker-track">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted/80"
          >
            <span className="zentro-pulse-dot h-1.5 w-1.5 rounded-full bg-accent/70" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
