import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mCardTitle,
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mSection,
} from "@/lib/marketing-layout";

const CAPABILITIES = [
  {
    title: "Incident Copilot",
    href: "/copilot",
    description: "Structured triage, suggested runbooks, and evidence handoff with human checkpoints.",
    icon: "bot" as const,
    wide: true,
  },
  {
    title: "Threat & exposure",
    href: "/auth/sign-in?next=/assets/certificates",
    description: "Cert expiry radar, secrets vault, prioritized findings.",
    icon: "shieldCheck" as const,
    wide: false,
  },
  {
    title: "Network defense",
    href: "/auth/sign-in?next=/assets/network",
    description: "Config baselines, drift detection, segment isolation.",
    icon: "server" as const,
    wide: false,
  },
  {
    title: "Automation Engine",
    href: "/automations",
    description: "Playbooks with dry-runs, risk scoring, and approval workflows before execution.",
    icon: "workflow" as const,
    wide: true,
  },
  {
    title: "Governance & access",
    href: "/auth/sign-in?next=/governance/access",
    description: "MFA coverage, policy blocks, reviewer notes.",
    icon: "keyRound" as const,
    wide: false,
  },
  {
    title: "Runbook Intelligence",
    href: "/runbooks",
    description: "Versioned procedures updated from every incident and pen test.",
    icon: "bookOpen" as const,
    wide: false,
  },
] as const;

export function CapabilityOrbit() {
  return (
    <MarketingReveal id="modules" className={`${mSection} zentro-quantum-section`} aria-labelledby="modules-heading">
      <div className={mContainer}>
        <p className={`${mEyebrow} zentro-eyebrow-cyber`}>⟡ Platform modules</p>
        <h2 id="modules-heading" className={`zentro-living-headline mt-2 ${mH2}`}>
          Modules on one incident spine
        </h2>
        <p className={mLede}>
          Triage, scan, govern, automate, and prove — linked by incidents, services, and audit
          events instead of copy-pasted workflows.
        </p>

        <div className="zentro-capability-orbit mt-10">
          {CAPABILITIES.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className={`group zentro-bento-cell flex flex-col rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 ${
                mod.wide ? "min-h-[9rem]" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-accent transition-colors group-hover:border-accent/30 group-hover:bg-accent/10">
                  <AppIcon name={mod.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className={mCardTitle}>{mod.title}</h3>
                  <p className={`mt-1.5 ${mBody}`}>{mod.description}</p>
                </div>
              </div>
              <span className="mt-auto pt-4 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Open module →
              </span>
            </Link>
          ))}
        </div>

        <p className={`mt-8 text-center ${mBody}`}>
          <Link href="/platform" className="font-medium text-accent hover:underline">
            Full platform map
          </Link>
          <span className="text-muted/50"> · </span>
          <Link href="/next" className="font-medium text-accent hover:underline">
            What&apos;s shipping
          </Link>
        </p>
      </div>
    </MarketingReveal>
  );
}
