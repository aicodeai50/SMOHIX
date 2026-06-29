import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { FutureCommandCore } from "@/components/landing/FutureCommandCore";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Button } from "@/components/ui/Button";
import { mBody, mContainer, mEyebrow, mH1, mHeroLede } from "@/lib/marketing-layout";
import {
  PRODUCT_HEADLINE,
  PRODUCT_VALUE_PROPOSITION,
} from "@/lib/product-identity";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

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
            <p className={`${mEyebrow} text-primary-muted`}>
              {SITE_BRAND_NAME} · zentro.run
            </p>
            <h1 className={`mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]`}>
              {PRODUCT_HEADLINE}
            </h1>
            <p className={`${mHeroLede} mt-5 max-w-xl`}>
              {PRODUCT_VALUE_PROPOSITION}
            </p>
            <p className={`mt-4 max-w-xl ${mBody}`}>
              Built for platform, SRE, and security teams who need speed with
              accountability — not another demo dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/auth/sign-in?next=/hub">
                <Button size="lg">Get started</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="secondary">
                  View pricing
                </Button>
              </Link>
            </div>

            <ul className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 ${mBody} text-muted`}>
              <li className="flex items-center gap-2">
                <AppIcon name="check" size={16} className="text-accent" />
                Incident command
              </li>
              <li className="flex items-center gap-2">
                <AppIcon name="check" size={16} className="text-accent" />
                Guarded automation
              </li>
              <li className="flex items-center gap-2">
                <AppIcon name="check" size={16} className="text-accent" />
                Audit evidence
              </li>
            </ul>
          </div>

          <div id="preview" className="lg:justify-self-end">
            <FutureCommandCore />
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
