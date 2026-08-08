import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBody, mCardTitle, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

const STEPS = [
  {
    n: "1",
    title: "Connect your automations",
    body: "Point webhooks, HTTP ingest tokens, or SIEM-shaped alerts at Smohix. Incidents dedupe into one timeline.",
    href: "/integrations",
    cta: "Integrations",
  },
  {
    n: "2",
    title: "Add approval rules",
    body: "Define policy blocks, dry-run requirements, and explicit approvers before anything irreversible runs.",
    href: "/auth/sign-in?next=/approvals",
    cta: "Approvals",
  },
  {
    n: "3",
    title: "Run safely with audit logs",
    body: "Execute playbooks after review. Every status change, approval, and automation event lands append-only.",
    href: "/auth/sign-in?next=/audit",
    cta: "Audit log",
  },
] as const;

export function GettingStartedSection() {
  return (
    <MarketingReveal
      id="how-it-works"
      className={`${mSection} smohix-quantum-section`}
      aria-labelledby="getting-started-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} smohix-eyebrow-cyber`}>How it works</p>
        <h2 id="getting-started-heading" className={`smohix-living-headline mt-2 ${mH2}`}>
          Three steps to guarded operations
        </h2>
        <p className={mLede}>
          {SITE_BRAND_NAME} sits on top of the tools you already run — adding approvals, guardrails,
          and audit evidence without replacing your stack.
        </p>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="smohix-bento-cell flex flex-col rounded-2xl p-6">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 bg-[#0a0c12] font-mono text-sm font-semibold text-accent"
                aria-hidden
              >
                {step.n}
              </span>
              <h3 className={`mt-4 ${mCardTitle}`}>{step.title}</h3>
              <p className={`mt-2 flex-1 ${mBody}`}>{step.body}</p>
              <Link href={step.href} className="mt-4 text-sm font-medium text-accent hover:underline">
                {step.cta} →
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </MarketingReveal>
  );
}
