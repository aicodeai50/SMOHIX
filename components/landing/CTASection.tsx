import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { buttonClassName } from "@/components/ui/Button";
import { mContainer, mH2, mSection } from "@/lib/marketing-layout";
import { SITE_BRAND_BYLINE } from "@/lib/site-brand";

export function CTASection() {
  return (
    <MarketingReveal className={`${mSection} border-t border-white/[0.06]`}>
      <div className={`${mContainer} text-center`}>
        <h2 className={mH2}>Ready to work with {SITE_BRAND_BYLINE}?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Try live products, start a scoped pilot, or build on the API — every path uses
          honest availability labels.
        </p>
        <CommercialPaths className="mx-auto mt-10 max-w-4xl" compact />
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <TrackableLink href="/contact?inquiry=pilot" event="start_pilot" className={buttonClassName({ size: "lg" })}>Apply for a pilot</TrackableLink>
          <TrackableLink href="/contact" event="contact_submit" className={buttonClassName({ size: "lg", variant: "secondary" })}>Contact us</TrackableLink>
        </div>
      </div>
    </MarketingReveal>
  );
}
