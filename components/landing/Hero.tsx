import Link from "next/link";

import { IntelligenceField, SmohixHorizon } from "@/components/architecture";
import { FutureCommandCore } from "@/components/landing/FutureCommandCore";
import { HeroSystemRail } from "@/components/landing/HeroSystemRail";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { Button } from "@/components/ui/Button";
import { COMPANY_HERO_SUBHEADING } from "@/lib/company-identity";
import {
  mContainer,
  mDisplay,
  mHeroLede,
  mStaggerGrid,
} from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

const CAPABILITIES = ["AI products", "Developer platforms", "Enterprise solutions"] as const;

export function Hero() {
  return (
    <MarketingReveal className="smohix-oe-hero smohix-oe-hero--composed smohix-spatial-grid relative overflow-x-clip overflow-y-visible">
      <IntelligenceField className="opacity-55" animate />
      <div className="smohix-oe-hero__architectural-field" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_72%_42%,rgba(16,185,129,0.05),transparent_55%)]"
        aria-hidden
      />

      <div className={`smohix-oe-hero__canvas relative py-12 sm:py-16 lg:py-[4.5rem] ${mContainer}`}>
        <div className="smohix-oe-hero__compose">
          <div className="smohix-oe-hero__intro relative z-[1] min-w-0">
            <div className="smohix-oe-hero__identity">
              <p className="smohix-oe-hero__identity-primary">{SITE_COMPANY_NAME}</p>
              <p className="smohix-oe-hero__identity-secondary">Intelligent operating environment</p>
            </div>
            <h1 className={`${mDisplay} smohix-oe-hero__headline mt-6`}>
              <span className="block">Intelligent software for</span>
              <span className="block">organizations that need to move</span>
              <span className="block smohix-oe-hero__headline-emphasis">fast — with control</span>
            </h1>
            <p className={`${mHeroLede} smohix-oe-hero__lede mt-5 max-w-[34rem] text-[1rem] sm:text-lg`}>
              {COMPANY_HERO_SUBHEADING}
            </p>
          </div>

          <div className={`smohix-oe-hero__actions relative z-[1] min-w-0 ${mStaggerGrid}`}>
            <div className="smohix-oe-hero__cta-row flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <TrackableLink href="/platform" event="explore_platform">
                <Button size="lg">Explore Platform</Button>
              </TrackableLink>
              <TrackableLink href="/products" event="explore_products">
                <Button size="lg" variant="secondary">
                  Explore products
                </Button>
              </TrackableLink>
              <TrackableLink href="/pilot" event="start_pilot">
                <Button size="md" variant="ghost" className="sm:px-4">
                  Start a pilot
                </Button>
              </TrackableLink>
            </div>
          </div>

          <div
            id="preview"
            className="smohix-oe-hero__command relative z-[1] min-w-0 max-w-full overflow-x-clip"
            aria-label="Operational command preview"
          >
            <div className="pointer-events-none absolute -inset-6 hidden overflow-hidden opacity-35 lg:block">
              <IntelligenceField animate={false} withNodes />
            </div>
            <FutureCommandCore />
          </div>

          <div className="smohix-oe-hero__support relative z-[1] min-w-0">
            <ul className="smohix-oe-hero__capability-rail" aria-label="Platform capabilities">
              {CAPABILITIES.map((item) => (
                <li key={item} className="smohix-oe-hero__capability-rail__item">
                  <span className="smohix-oe-hero__capability-mark" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="smohix-oe-hero__returning mt-4">
              Already onboarded?{" "}
              <Link href="/auth/sign-in?next=/hub" className="text-muted/80 hover:text-accent hover:underline">
                Sign in to Hub
              </Link>
            </p>
          </div>

          <div className="smohix-oe-hero__spine" aria-hidden />

          <div className="smohix-oe-hero__boundary relative z-[1] min-w-0">
            <SmohixHorizon />
            <HeroSystemRail />
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
