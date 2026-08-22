import Link from "next/link";

import { IntelligenceField, SmohixHorizon } from "@/components/architecture";
import { AppIcon } from "@/components/icons/AppIcon";
import { FutureCommandCore } from "@/components/landing/FutureCommandCore";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { Button } from "@/components/ui/Button";
import {
  COMPANY_HERO_HEADLINE,
  COMPANY_HERO_SUBHEADING,
} from "@/lib/company-identity";
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
    <MarketingReveal className="smohix-oe-hero smohix-spatial-grid relative overflow-x-clip overflow-y-visible">
      <IntelligenceField className="opacity-75" animate />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_18%_20%,rgba(16,185,129,0.09),transparent_58%)]"
        aria-hidden
      />
      <div className={`smohix-oe-hero__canvas relative py-14 sm:py-20 lg:py-24 ${mContainer}`}>
        <div className="grid min-w-0 items-end gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 xl:gap-20">
          <div className="relative z-[1] lg:pb-6">
            <p className={mEyebrow}>{SITE_BRAND_BYLINE}</p>
            <p className={`mt-3 ${mSystemMeta} text-muted/80`}>
              {SITE_BRAND_NAME} · 2050 operating environment
            </p>
            <h1 className={`${mDisplay} mt-5 max-w-[14ch] sm:max-w-none`}>
              {COMPANY_HERO_HEADLINE}
            </h1>
            <p className={`${mHeroLede} mt-6 max-w-xl text-[1rem] sm:text-lg`}>
              {COMPANY_HERO_SUBHEADING}
            </p>

            <div className="mt-8 max-w-lg">
              <SmohixHorizon />
              <div className="smohix-oe-hero__meta-rail">
                <span>HQ platform</span>
                <span>Intelligence layer</span>
                <span>Human authority</span>
                <span>Live systems</span>
              </div>
            </div>

            <div className={`mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap ${mStaggerGrid}`}>
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

            <ul className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/[0.06] pt-6 ${mBody} text-muted`}>
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

          <div
            id="preview"
            className="relative z-[1] min-w-0 max-w-full overflow-x-clip lg:-mr-4 lg:translate-y-2 lg:justify-self-end xl:mr-0"
            aria-hidden={false}
          >
            <div className="pointer-events-none absolute -inset-8 hidden overflow-hidden rounded-[1rem] opacity-50 lg:block lg:-inset-10">
              <IntelligenceField animate={false} withNodes />
            </div>
            <div className="relative overflow-hidden border border-white/[0.08] bg-[rgba(6,8,12,0.65)] p-1 shadow-[0_40px_100px_-60px_rgba(0,0,0,0.9)]">
              <FutureCommandCore />
            </div>
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
