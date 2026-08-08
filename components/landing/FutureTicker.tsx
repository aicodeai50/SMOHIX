"use client";

const TICKER_ITEMS = [
  "Guarded execution · Human checkpoint",
  "Dry-run validated · Rollback armed",
  "Append-only audit · Evidence on demand",
  "Incident triage · Runbook intelligence",
  "Approvals · Policy blocks · Guardrails",
  "Unified ingest · Single incident spine",
  "SOC 2 · ISO · FedRAMP · Eight frameworks",
  "Controlled automation · No silent fixes",
] as const;

export function FutureTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="smohix-future-ticker mt-10 border-t border-white/[0.06] pt-6" aria-hidden>
      <div className="smohix-future-ticker-track">
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted/80"
          >
            <span className="smohix-pulse-dot h-1.5 w-1.5 rounded-full bg-accent/70" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
