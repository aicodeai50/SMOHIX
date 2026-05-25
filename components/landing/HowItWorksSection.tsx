import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mSection,
} from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

const STEPS = [
  {
    n: "01",
    title: "Signal received",
    body: "Webhook, ingest token, or responder opens one controlled incident record.",
  },
  {
    n: "02",
    title: "Workflow loaded",
    body: "Owner, service, and versioned runbook — same checklist for every responder.",
  },
  {
    n: "03",
    title: "Guarded suggestion",
    body: "Copilot and playbooks propose next steps — read-only until promoted.",
  },
  {
    n: "04",
    title: "Approval recorded",
    body: "High-risk actions wait for explicit approval before execution.",
  },
  {
    n: "05",
    title: "Verified execution",
    body: "Dry-run review and policy checks pass — then connectors run your change.",
  },
  {
    n: "06",
    title: "Evidence captured",
    body: "Status, approvals, and automation events land in append-only audit.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <MarketingReveal
      id="how-it-works"
      className={mSection}
      aria-labelledby="how-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Operator flow</p>
        <h2 id="how-heading" className={`mt-2 ${mH2}`}>
          How {SITE_BRAND_NAME} runs an incident
        </h2>
        <p className={mLede}>
          From alert to audit trail — six checkpoints, zero silent automation.
        </p>

        <ol className="zentro-timeline-rail mt-10 space-y-0">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className="relative flex gap-5 pb-8 pl-10 last:pb-0"
            >
              <span
                className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-[#0a0c12] font-mono text-[10px] font-semibold text-accent shadow-[0_0_20px_-6px_var(--accent-glow)]"
                aria-hidden
              >
                {step.n}
              </span>
              <div className="min-w-0 flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-accent/20">
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
              {i < STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute left-4 top-10 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-accent/30 to-transparent"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </MarketingReveal>
  );
}
