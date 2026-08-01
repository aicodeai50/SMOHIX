import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mCard,
  mCardLink,
  mContainer,
  mEyebrow,
  mFocusRing,
  mH2,
  mSection,
  mSectionGlow,
  mStaggerGrid,
  mTrustGrid,
} from "@/lib/marketing-layout";

const TRUST_PILLARS = [
  {
    title: "Development progress",
    detail: "Changelog and roadmap reflect what shipped — not marketing fiction.",
    icon: "scrollText" as const,
  },
  {
    title: "Open architecture",
    detail: "Documented APIs, connectors, and deployment patterns you can inspect.",
    icon: "server" as const,
  },
  {
    title: "Privacy by design",
    detail: "Server-side secrets, consent-aware analytics, and clear data boundaries.",
    icon: "shieldCheck" as const,
  },
  {
    title: "Developer first",
    detail: "Keys, webhooks, and reference docs for teams integrating today.",
    icon: "keyRound" as const,
  },
] as const;

const TRUST_LINKS = [
  { href: "/trust", label: "Trust center", detail: "Security, privacy, and maturity disclosure" },
  { href: "/status", label: "Service status", detail: "Runtime checks when configured" },
  { href: "/security", label: "Security", detail: "Responsible disclosure and posture" },
  { href: "/changelog", label: "Changelog", detail: "Real product progress" },
] as const;

export function HomepageTrustSection() {
  return (
    <MarketingReveal
      id="trust"
      className={`${mSection} ${mSectionGlow}`}
      aria-labelledby="homepage-trust-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Trust</p>
        <h2 id="homepage-trust-heading" className={mH2}>
          Built for review, honest about maturity
        </h2>
        <p className={`mt-3 max-w-2xl ${mBody}`}>
          We do not claim certifications or customer metrics we have not published. See
          what is current, in progress, or planned.
        </p>

        <ul className={`mt-10 ${mTrustGrid} ${mStaggerGrid}`}>
          {TRUST_PILLARS.map((item) => (
            <li key={item.title} className={mCard}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05]">
                <AppIcon name={item.icon} size={18} className="text-accent" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className={`mt-1.5 text-sm ${mBody}`}>{item.detail}</p>
            </li>
          ))}
        </ul>

        <ul className={`mt-8 ${mTrustGrid} ${mStaggerGrid}`}>
          {TRUST_LINKS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`block ${mCardLink} ${mFocusRing}`}>
                <span className="font-medium text-foreground">{item.label}</span>
                <span className={`mt-1 block text-sm ${mBody}`}>{item.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MarketingReveal>
  );
}
