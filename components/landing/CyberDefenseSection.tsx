import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mCard,
  mCardTitle,
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mSection,
  mStaggerGrid,
} from "@/lib/marketing-layout";

const pillars = [
  {
    title: "Threat surface mapping",
    line: "Inventory services, dependencies, and blast radius before an attacker maps it for you.",
    href: "/auth/sign-in?next=/services",
    tag: "Live",
  },
  {
    title: "Exposure & vulnerability scans",
    line: "Track certificates, secrets rotation, and network drift — prioritized findings tied to owners.",
    href: "/auth/sign-in?next=/assets/certificates",
    tag: "Live",
  },
  {
    title: "Penetration test workflows",
    line: "Structured red-team exercises with guarded execution, scope controls, and evidence export.",
    href: "/cybersecurity#pentest",
    tag: "Guided",
  },
  {
    title: "Access posture & MFA coverage",
    line: "Snapshot identity hygiene, policy rules, and high-risk paths that bypass approval gates.",
    href: "/auth/sign-in?next=/governance/access",
    tag: "Live",
  },
  {
    title: "Intrusion correlation",
    line: "Normalize alerts from Datadog, webhooks, and ingest tokens into deduped incident records.",
    href: "/auth/sign-in?next=/settings/connectors",
    tag: "Live",
  },
  {
    title: "Guarded remediation",
    line: "Contain and eradicate with dry-runs, risk scoring, and explicit approval — never silent shell.",
    href: "/auth/sign-in?next=/automations",
    tag: "Live",
  },
] as const;

export function CyberDefenseSection() {
  return (
    <MarketingReveal id="cyber" className={mSection}>
      <div className={mContainer}>
        <p className={`${mEyebrow} smohix-eyebrow-cyber`}>Cybersecurity command</p>
        <h2 className={`mt-2 ${mH2}`}>Detect, scan, contain — without losing the audit trail</h2>
        <p className={mLede}>
          Smohix is built for security operations centers and platform teams at scale: correlate
          intrusions, monitor exposure, run penetration exercises, and remediate through the same
          approval-gated control plane as production change.
        </p>

        <div className={`mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${mStaggerGrid}`}>
          {pillars.map((item) => (
            <Link key={item.title} href={item.href} className={`${mCard} group block no-underline`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className={mCardTitle}>{item.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    item.tag === "Live"
                      ? "border border-[var(--scan-dim)] bg-[var(--scan-dim)] text-[#6ee7b7]"
                      : "border border-[var(--cyber-dim)] bg-[var(--cyber-dim)] text-[#c4b5fd]"
                  }`}
                >
                  {item.tag}
                </span>
              </div>
              <p className={`mt-3 ${mBody}`}>{item.line}</p>
              <span className="mt-4 inline-block text-sm font-medium text-accent/95 group-hover:underline">
                Open capability →
              </span>
            </Link>
          ))}
        </div>

        <p className={`mt-8 ${mBody}`}>
          Need the full security narrative?{" "}
          <Link href="/cybersecurity" className="font-medium text-accent hover:underline">
            Read the cybersecurity overview
          </Link>{" "}
          or{" "}
          <Link href="/enterprise" className="font-medium text-accent hover:underline">
            enterprise deployment options
          </Link>
          .
        </p>
      </div>
    </MarketingReveal>
  );
}
