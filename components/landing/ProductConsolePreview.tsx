import type { ReactNode } from "react";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mSectionPreview,
} from "@/lib/marketing-layout";

export function ProductConsolePreview() {
  return (
    <MarketingReveal
      id="product-preview"
      className={mSectionPreview}
      aria-labelledby="preview-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Product preview</p>
        <h2 id="preview-heading" className={`zentro-living-headline ${mH2}`}>
          Unified command console
        </h2>
        <p className={mLede}>
          Six surfaces security and platform teams run together — incidents, exposure, network
          posture, guarded automation, identity hygiene, and audit evidence.
        </p>

        <div
          className="zentro-holo-panel mt-8 overflow-hidden"
          aria-label="Illustrative console layout, not live data"
        >
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-danger/40 zentro-pulse-dot" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/40" />
            </span>
            <span className="font-mono text-[11px] text-muted">zentro.run / command</span>
            <span className="ml-auto font-mono text-[10px] text-[#6ee7b7]">SOC · live</span>
          </div>
          <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
            <Panel
              label="Incidents"
              accent="text-accent/90"
              mono="auth-api · critical · investigating"
              footer="Timeline · owner · linked runbook"
            >
              <div className="mt-3 space-y-2">
                <div className="h-2 w-full rounded bg-white/[0.08]" />
                <div className="h-2 w-[80%] rounded bg-white/[0.06]" />
                <div className="h-2 w-full rounded bg-white/[0.05]" />
              </div>
            </Panel>
            <Panel
              label="Threat surface"
              accent="text-[#c4b5fd]"
              mono="14 services · 3 critical deps"
              footer="Exposure map · dependency graph"
            >
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <span
                    key={n}
                    className={`h-6 rounded border border-white/[0.08] ${n === 2 ? "bg-[var(--danger-dim)]" : "bg-white/[0.04]"}`}
                  />
                ))}
              </div>
            </Panel>
            <Panel
              label="Network scan"
              accent="text-[#6ee7b7]"
              mono="drift · 2 findings · edge-fw"
              footer="Config snapshots · device inventory"
            >
              <p className="mt-3 font-mono text-[9px] leading-relaxed text-foreground/70">
                <span className="text-danger">!</span> ACL mismatch vs baseline
                <br />
                <span className="text-warning">~</span> cert expires 12d · api-gateway
              </p>
            </Panel>
            <Panel
              label="Automations"
              accent="text-accent/90"
              mono="Playbook: isolate-segment"
              footer="Dry-run · approval · execute"
            >
              <span className="mt-3 inline-flex rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-200/95">
                Dry-run passed
              </span>
              <div className="mt-3 flex gap-2">
                <span className="h-7 flex-1 rounded-md bg-white/[0.08]" />
                <span className="h-7 w-16 rounded-md bg-accent/25" />
              </div>
            </Panel>
            <Panel
              label="Access posture"
              accent="text-[#c4b5fd]"
              mono="MFA 94% · 1 policy gap"
              footer="Identity hygiene · governance rules"
            >
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <span className="block h-full w-[94%] rounded-full bg-gradient-to-r from-[var(--scan)] to-accent/80" />
              </div>
            </Panel>
            <Panel
              label="Audit"
              accent="text-accent/90"
              mono="append-only trail"
              footer="Export · compliance handoff"
            >
              <pre className="mt-3 overflow-x-auto rounded-lg border border-white/[0.08] bg-black/50 p-2 font-mono text-[9px] leading-relaxed text-foreground/75">
                {`intrusion.correlated\npentest.scope_approved\nremediation.executed`}
              </pre>
            </Panel>
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}

function Panel({
  label,
  accent,
  mono,
  footer,
  children,
}: {
  label: string;
  accent: string;
  mono: string;
  footer: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${accent}`}>{label}</p>
      <p className="mt-3 font-mono text-[10px] text-muted">{mono}</p>
      {children}
      <p className="mt-4 text-[10px] text-muted">{footer}</p>
    </div>
  );
}
