import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mContainer, mSectionTight } from "@/lib/marketing-layout";

/** Illustrative SOC posture — not live telemetry. */
const METRICS = [
  { label: "Open incidents", value: "12", delta: "−3 vs 24h", tone: "text-accent" },
  { label: "Critical exposure", value: "2", delta: "needs owner", tone: "text-danger" },
  { label: "MFA coverage", value: "94%", delta: "+2% wk", tone: "text-[#6ee7b7]" },
  { label: "Pending approvals", value: "5", delta: "2 high-risk", tone: "text-warning" },
  { label: "Drift findings", value: "7", delta: "network", tone: "text-[#c4b5fd]" },
  { label: "Audit events (24h)", value: "1.2k", delta: "append-only", tone: "text-muted" },
] as const;

export function SecurityMetricsStrip() {
  return (
    <MarketingReveal
      className={`${mSectionTight} border-b border-white/[0.06] bg-black/20`}
      aria-label="Illustrative security operations metrics, not live data"
    >
      <div className={mContainer}>
        <div className="zentro-holo-panel grid gap-px overflow-hidden sm:grid-cols-2 lg:grid-cols-6">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-background/90 px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                {m.label}
              </p>
              <p className={`mt-1 font-mono text-2xl font-semibold tracking-tight ${m.tone}`}>
                {m.value}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted">{m.delta}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-muted/80">
          Illustrative command-center metrics — your workspace reflects real connectors and data.
        </p>
      </div>
    </MarketingReveal>
  );
}
