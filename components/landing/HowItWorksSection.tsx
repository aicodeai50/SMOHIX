import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mContainer,
  mH2,
  mLede,
  mPanelShell,
  mSection,
  mStaggerGrid,
} from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

const STEPS = [
  {
    n: "1",
    title: "Incident detected",
    body: "Monitoring webhook, HTTP ingest token, or a responder opens an incident manually — one controlled record.",
  },
  {
    n: "2",
    title: `${SITE_BRAND_NAME} loads a controlled workflow`,
    body: "Assign owner, link a service, attach a versioned runbook — everyone sees the same checklist.",
  },
  {
    n: "3",
    title: "Suggested automation appears",
    body: "Playbooks (and Copilot triage) propose the next mechanical step — still read-only until you promote it.",
  },
  {
    n: "4",
    title: "Approval required",
    body: "High-risk actions wait for an explicit approval record before execution.",
  },
  {
    n: "5",
    title: "Automation runs through your connectors",
    body: "Execution happens only after dry-run review and policy checks you configure.",
  },
  {
    n: "6",
    title: "Everything is logged",
    body: "Status, approvals, and automation-related events land in the activity log — plus incident export where enabled.",
  },
] as const;

const GUARDED = [
  "Nothing irreversible runs straight from chat — dry-run or human checkpoint first.",
  "Approvals and status transitions are written for audit, not buried in DMs.",
  `Connectors are yours — ${SITE_BRAND_NAME} does not silently phone home to your cloud APIs.`,
] as const;

export function HowItWorksSection() {
  return (
    <MarketingReveal
      id="how-it-works"
      className={mSection}
      aria-labelledby="how-heading"
    >
      <div className={mContainer}>
        <h2 id="how-heading" className={mH2}>
          How {SITE_BRAND_NAME} runs an incident
        </h2>
        <p className={mLede}>
          Read this as an operator workflow from alert to verified execution and evidence.
        </p>

        <p
          className={`mt-6 px-4 py-3 font-mono text-[11px] leading-relaxed text-foreground/85 sm:text-xs ${mPanelShell}`}
        >
          <span className="text-muted">Typical flow:</span> signal received → incident opened →
          runbook selected → dry-run validated → approval recorded → guarded execution → audit trail
        </p>

        <div
          className={`mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start ${mStaggerGrid}`}
        >
          <ol className="space-y-6">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/35 bg-accent/10 text-xs font-semibold text-accent"
                  aria-hidden
                >
                  {step.n}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <aside className="shynvo-glass rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-accent/90">
              Why &ldquo;guarded&rdquo;?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Automation that never skips the control plane you can show in review:
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
              {GUARDED.map((line) => (
                <li key={line} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </MarketingReveal>
  );
}
