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
import { mBody, mContainer, mEyebrow, mHeroLede, mStaggerGrid } from "@/lib/marketing-layout";
import { SITE_BRAND_BYLINE } from "@/lib/site-brand";

export function Hero() {
  return (
    <MarketingReveal className="smohix-spatial-grid relative overflow-hidden border-b border-white/[0.06]">
      <IntelligenceField className="opacity-70" animate withNodes />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(16,185,129,0.07),transparent_55%)]"
        aria-hidden
      />
      <div className={`relative py-16 sm:py-24 lg:py-28 ${mContainer}`}>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div>
            <p className={`${mEyebrow} text-accent/80`}>{SITE_BRAND_BYLINE}</p>
            <h1 className="smohix-headline mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {COMPANY_HERO_HEADLINE}
            </h1>
            <p className={`${mHeroLede} mt-5 max-w-xl`}>{COMPANY_HERO_SUBHEADING}</p>

            <div className="mt-7 max-w-md">
              <SmohixHorizon />
              <p className={`mt-3 font-mono text-[11px] tracking-[0.16em] text-muted/70`}>
                HQ · PLATFORM · PRODUCTS · INTELLIGENCE
              </p>
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

            <ul className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 ${mBody} text-muted`}>
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

          <div id="preview" className="relative lg:justify-self-end" aria-hidden={false}>
            <div className="pointer-events-none absolute -inset-6 rounded-[1.25rem] opacity-60 sm:-inset-8">
              <IntelligenceField animate={false} />
            </div>
            <FutureCommandCore />
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
