import Link from "next/link";

import { IntelligenceField, SmohixHorizon } from "@/components/architecture";
import { AppIcon } from "@/components/icons/AppIcon";
import { FutureCommandCore } from "@/components/landing/FutureCommandCore";
import { HeroSystemRail } from "@/components/landing/HeroSystemRail";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { Button } from "@/components/ui/Button";
import { COMPANY_HERO_SUBHEADING } from "@/lib/company-identity";
import {
  mBody,
  mContainer,
  mDisplay,
  mEyebrow,
  mHeroLede,
  mStaggerGrid,
  mSystemMeta,
} from "@/lib/marketing-layout";
import { SITE_BRAND_BYLINE, SITE_BRAND_NAME } from "@/lib/site-brand";

export function Hero() {
  return (
    <MarketingReveal className="smohix-oe-hero smohix-oe-hero--composed smohix-spatial-grid relative overflow-x-clip overflow-y-visible">
      <IntelligenceField className="opacity-55" animate />
      <div className="smohix-oe-hero__architectural-field" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_72%_42%,rgba(16,185,129,0.07),transparent_55%)]"
        aria-hidden
      />

      <div className={`smohix-oe-hero__canvas relative py-12 sm:py-16 lg:py-[4.5rem] ${mContainer}`}>
        <div className="smohix-oe-hero__compose">
          <div className="smohix-oe-hero__intro relative z-[1] min-w-0">
            <p className={mEyebrow}>{SITE_BRAND_BYLINE}</p>
            <p className={`mt-3 ${mSystemMeta} text-muted/80`}>
              {SITE_BRAND_NAME} · HQ operating environment
            </p>
            <h1 className={`${mDisplay} smohix-oe-hero__headline mt-5`}>
              <span className="block">Intelligent software for</span>
              <span className="block">organizations that need to move</span>
              <span className="block">fast — with control</span>
            </h1>
            <p className={`${mHeroLede} mt-5 max-w-[34rem] text-[1rem] sm:text-lg`}>
              {COMPANY_HERO_SUBHEADING}
            </p>
          </div>

          <div className={`smohix-oe-hero__actions relative z-[1] min-w-0 ${mStaggerGrid}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <TrackableLink href="/platform" event="explore_platform">
                <Button size="lg">Explore Platform</Button>
              </TrackableLink>
              <TrackableLink href="/products" event="explore_products">
                <Button size="lg" variant="secondary">
                  Explore products
                </Button>
              </TrackableLink>
              <TrackableLink href="/pilot" event="start_pilot">
                <Button size="lg" variant="secondary">
                  Start a pilot
                </Button>
              </TrackableLink>
            </div>
          </div>

          <div
            id="preview"
            className="smohix-oe-hero__command relative z-[1] min-w-0 max-w-full overflow-x-clip"
            aria-label="Live command preview"
          >
            <p className={`mb-3 hidden ${mSystemMeta} text-muted/70 lg:block`}>
              Command environment · linked to headline axis
            </p>
            <div className="pointer-events-none absolute -inset-6 hidden overflow-hidden opacity-40 lg:block">
              <IntelligenceField animate={false} withNodes />
            </div>
            <FutureCommandCore />
          </div>

          <div className="smohix-oe-hero__support relative z-[1] min-w-0">
            <ul className={`flex flex-wrap gap-x-6 gap-y-2 border-t border-white/[0.06] pt-6 ${mBody} text-muted`}>
              <li className="flex items-center gap-2">
                <AppIcon name="check" size={16} className="text-accent" aria-hidden />
                AI products
              </li>
              <li className="flex items-center gap-2">
                <AppIcon name="check" size={16} className="text-accent" aria-hidden />
                Developer platforms
              </li>
              <li className="flex items-center gap-2">
                <AppIcon name="check" size={16} className="text-accent" aria-hidden />
                Enterprise solutions
              </li>
            </ul>
            <p className={`mt-4 ${mBody} text-muted`}>
              Already onboarded?{" "}
              <Link
                href="/auth/sign-in?next=/hub"
                className="font-medium text-accent hover:underline"
              >
                Sign in to Hub
              </Link>
              .
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
