import {
  mContainer,
  mH2,
  mLede,
  mPanelShell,
  mSectionEnter,
  mSectionPreview,
} from "@/lib/marketing-layout";

/**
 * Illustrative console chrome only — no live data. Gives first-time visitors a concrete
 * sense of surfaces before sign-in.
 */
export function ProductConsolePreview() {
  return (
    <section
      id="preview"
      className={`${mSectionPreview} ${mSectionEnter}`}
      aria-labelledby="preview-heading"
    >
      <div className={mContainer}>
        <h2 id="preview-heading" className={mH2}>
          What you actually click
        </h2>
        <p className={mLede}>
          Three routes you will live in during an incident — incidents for state, automations for
          guarded change, audit for proof.
        </p>

        <div
          className={`mt-8 overflow-hidden bg-[#070a0d] shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ${mPanelShell} border-white/[0.1]`}
          aria-label="Illustrative console layout, not live data"
        >
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            </span>
            <span className="font-mono text-[11px] text-muted">shynvo.app / console</span>
          </div>
          <div className="grid gap-px bg-white/[0.06] md:grid-cols-3">
            <div className="bg-background p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent/90">
                Incidents
              </p>
              <p className="mt-3 font-mono text-[10px] text-muted">checkout-api · high · mitigating</p>
              <div className="mt-3 space-y-2">
                <div className="h-2 w-full rounded bg-white/[0.08]" />
                <div className="h-2 w-[80%] rounded bg-white/[0.06]" />
                <div className="h-2 w-full rounded bg-white/[0.05]" />
              </div>
              <p className="mt-4 text-[10px] text-muted">Timeline · owner · linked runbook</p>
            </div>
            <div className="bg-background p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent/90">
                Automations
              </p>
              <p className="mt-3 text-[10px] font-medium text-foreground/90">Playbook: scale-out edge</p>
              <div className="mt-3 inline-flex rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-200/95">
                Dry-run result
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-muted">
                Simulated steps · no production calls until approved
              </p>
              <div className="mt-4 flex gap-2">
                <span className="h-7 flex-1 rounded-md bg-white/[0.08]" />
                <span className="h-7 w-16 rounded-md bg-accent/25" />
              </div>
            </div>
            <div className="bg-background p-4 sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent/90">
                Audit
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-white/[0.08] bg-black/50 p-2 font-mono text-[9px] leading-relaxed text-foreground/75">
                {`incident.status_updated\nautomation.dry_run\napproval.recorded`}
              </pre>
              <p className="mt-3 text-[10px] text-muted">Append-oriented · export where enabled</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
