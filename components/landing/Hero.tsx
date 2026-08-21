import Link from "next/link";

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
    <MarketingReveal className="relative overflow-hidden border-b border-white/[0.06]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]"
        aria-hidden
      />
      <div className={`relative py-16 sm:py-24 lg:py-28 ${mContainer}`}>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div>
            <p className={`${mEyebrow} text-primary-muted`}>{SITE_BRAND_BYLINE}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {COMPANY_HERO_HEADLINE}
            </h1>
            <p className={`${mHeroLede} mt-5 max-w-xl`}>{COMPANY_HERO_SUBHEADING}</p>

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

          <div id="preview" className="lg:justify-self-end" aria-hidden={false}>
            <FutureCommandCore />
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
