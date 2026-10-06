import Link from "next/link";
import { getAllRegistryProducts } from "@/lib/product-registry";

import { IntelligenceField, SmohixHorizon } from "@/components/architecture";
import { FutureCommandCore } from "@/components/landing/FutureCommandCore";
import { HeroSystemRail } from "@/components/landing/HeroSystemRail";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { buttonClassName } from "@/components/ui/Button";
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_72%_42%,rgba(104,113,241,0.06),transparent_55%)]"
        aria-hidden
      />

      <div className={`smohix-oe-hero__canvas relative py-12 sm:py-16 lg:py-[4.5rem] ${mContainer}`}>
        <div className="smohix-oe-hero__compose">
          <div className="smohix-oe-hero__intro relative z-[1] min-w-0">
            <div className="smohix-oe-hero__identity">
              <p className="smohix-oe-hero__identity-primary">{SITE_COMPANY_NAME} HQ</p>
            </div>
            <h1 className={`${mDisplay} smohix-oe-hero__headline mt-6`}>
              Intelligent software for organizations that need to{" "}
              <span className="smohix-oe-hero__headline-emphasis">move fast — with control.</span>
            </h1>
            <p className={`${mHeroLede} smohix-oe-hero__lede mt-5 max-w-[34rem] text-[1rem] sm:text-lg`}>
              {COMPANY_HERO_SUBHEADING}
            </p>
          </div>

          <div className={`smohix-oe-hero__actions relative z-[1] min-w-0 ${mStaggerGrid}`}>
            <div className="smohix-oe-hero__cta-row flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <TrackableLink href="/platform" event="explore_platform" className={buttonClassName({ size: "lg" })}>Explore Platform</TrackableLink>
              <TrackableLink href="/products" event="explore_products" className={buttonClassName({ size: "lg", variant: "secondary" })}>Explore products</TrackableLink>
              <TrackableLink href="/pilot" event="start_pilot" className={buttonClassName({ size: "md", variant: "ghost", className: "sm:px-4" })}>Start a pilot</TrackableLink>
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
            <FutureCommandCore products={getAllRegistryProducts().filter((product) => ["smohix-platform", "smohix-ai", "smohix-assistant", "private-ai"].includes(product.id)).map((product) => ({ id: product.id, name: product.publicName, href: product.productPagePath }))} />
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
            <Link href="/#hq-guide" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">Ask the HQ guide →</Link>
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
