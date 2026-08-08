import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mPanelShell,
  mSection,
  mStaggerGrid,
} from "@/lib/marketing-layout";

const STEPS = [
  {
    n: "1",
    title: "Signal ingested",
    body: "SIEM, EDR, WAF, or custom webhook opens a deduped incident with severity and service context.",
  },
  {
    n: "2",
    title: "Surface mapped",
    body: "Dependencies, certificates, and network assets attach to the incident — blast radius visible before action.",
  },
  {
    n: "3",
    title: "Exposure prioritized",
    body: "Findings ranked by criticality; drift and posture gaps route to owners with policy hints.",
  },
  {
    n: "4",
    title: "Containment scoped",
    body: "Playbooks propose isolate-segment, rotate-secret, or block-rule changes — dry-run only until reviewed.",
  },
  {
    n: "5",
    title: "Security approval",
    body: "High-risk remediation requires explicit approver record — aligned with change and access policy.",
  },
  {
    n: "6",
    title: "Evidence exported",
    body: "Timeline, approvals, and automation events export for IR reports, regulators, and post-mortems.",
  },
] as const;

export function SecurityWorkflowSection() {
  return (
    <MarketingReveal id="security-workflow" className={mSection}>
      <div className={mContainer}>
        <p className={`${mEyebrow} smohix-eyebrow-cyber`}>Breach &amp; threat response</p>
        <h2 className={`mt-2 ${mH2}`}>How security teams run a contained response</h2>
        <p className={mLede}>
          Parallel to incident ops — optimized for intrusion, exposure, and penetration remediation
          without losing guardrails.
        </p>

        <p
          className={`mt-6 px-4 py-3 font-mono text-[11px] leading-relaxed text-foreground/85 sm:text-xs ${mPanelShell}`}
        >
          <span className="text-muted">Security flow:</span> alert correlated → surface mapped →
          exposure triaged → containment dry-run → approval → guarded execute → audit export
        </p>

        <ol className={`mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${mStaggerGrid}`}>
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--cyber-dim)] bg-[var(--cyber-dim)] text-xs font-semibold text-[#c4b5fd]">
                {step.n}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-muted">
          <Link href="/cybersecurity" className="font-medium text-accent hover:underline">
            Full cybersecurity overview →
          </Link>
          {" · "}
          <Link href="/next" className="font-medium text-accent hover:underline">
            What we ship next →
          </Link>
        </p>
      </div>
    </MarketingReveal>
  );
}
