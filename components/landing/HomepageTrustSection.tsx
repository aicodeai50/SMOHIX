import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBody, mContainer, mEyebrow, mH2, mSection } from "@/lib/marketing-layout";

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
      className={mSection}
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
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
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
