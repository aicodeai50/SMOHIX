import Link from "next/link";

import { FutureCommandCore } from "@/components/landing/FutureCommandCore";
import { FutureTicker } from "@/components/landing/FutureTicker";
import { LivingPulse } from "@/components/landing/LivingPulse";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { getTrialHref } from "@/lib/billing";
import { mBody, mContainer, mEyebrow, mH1, mHeroLede } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export function Hero({
  signedInCheckoutUrl,
  signedInTeamCheckoutUrl,
}: {
  signedInCheckoutUrl?: string | null;
  signedInTeamCheckoutUrl?: string | null;
}) {
  const trialHref = signedInCheckoutUrl?.trim() || getTrialHref();
  const teamHref = signedInTeamCheckoutUrl?.trim();

  return (
    <MarketingReveal className="zentro-hero-future relative overflow-hidden border-b border-white/[0.06]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(94,225,255,0.14),transparent)]"
        aria-hidden
      />
      <div className={`relative py-14 sm:py-20 lg:py-24 ${mContainer}`}>
        <LivingPulse />
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          <div>
            <p className={`${mEyebrow} zentro-eyebrow-cyber`}>
              ⟡ {SITE_BRAND_NAME} · Enterprise operations &amp; cybersecurity
            </p>
            <h1 className={`zentro-living-headline zentro-headline mt-3 max-w-3xl ${mH1}`}>
              The command platform for incident response, cybersecurity, and compliance
            </h1>
            <p className={mHeroLede}>
              <span className="text-foreground/90">
                {SITE_BRAND_NAME} correlates signals across your infrastructure, guides remediation
                behind approvals and dry-runs, and records every operational decision with audit-grade
                evidence — for platform, SOC, SRE, and GRC teams.
              </span>
            </p>
            <p className={`mt-3 max-w-xl ${mBody}`}>
              From alert to verified fix in a single console — built for teams who refuse silent
              automation and missing proof.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/auth/sign-in?next=/hub"
                className="zentro-launch-beacon inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_40px_-6px_var(--accent-glow)] transition-all hover:shadow-[0_0_48px_-4px_var(--accent-glow)] hover:opacity-95"
              >
                Open the console
              </Link>
              <Link
                href="/cybersecurity"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--cyber)_45%,transparent)] bg-[var(--cyber-dim)] px-5 text-sm font-medium text-foreground/90 transition-colors hover:border-[var(--cyber)]"
              >
                Cybersecurity
              </Link>
              <Link
                href="/enterprise"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/35 hover:text-accent"
              >
                Enterprise
              </Link>
            </div>

            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <a href="#how-it-works" className="hover:text-accent hover:underline">
                How it works
              </a>
              <span className="text-muted/35" aria-hidden>
                ·
              </span>
              <a href="#product-preview" className="hover:text-accent hover:underline">
                Product preview
              </a>
              <span className="text-muted/35" aria-hidden>
                ·
              </span>
              <a href="#pricing" className="hover:text-accent hover:underline">
                Pricing
              </a>
              <span className="text-muted/35" aria-hidden>
                ·
              </span>
              <Link href="/platform" className="hover:text-accent hover:underline">
                Platform map
              </Link>
              <span className="text-muted/35" aria-hidden>
                ·
              </span>
              <a href="#command" className="hover:text-accent hover:underline">
                Command surface
              </a>
              <span className="text-muted/35" aria-hidden>
                ·
              </span>
              <a href="#modules" className="hover:text-accent hover:underline">
                Modules
              </a>
              <span className="text-muted/35" aria-hidden>
                ·
              </span>
              <a
                href={trialHref}
                className="hover:text-accent hover:underline"
                {...(trialHref.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {signedInCheckoutUrl ? "Subscribe (Pro)" : "Start trial"}
              </a>
              {teamHref ? (
                <>
                  <span className="text-muted/35" aria-hidden>
                    ·
                  </span>
                  <a
                    href={teamHref}
                    className="hover:text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Team checkout
                  </a>
                </>
              ) : null}
            </p>
          </div>

          <div id="preview" className="lg:justify-self-end">
            <FutureCommandCore />
          </div>
        </div>

        <FutureTicker />
      </div>
    </MarketingReveal>
  );
}
