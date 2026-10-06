import Link from "next/link";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { buttonClassName } from "@/components/ui/Button";
import { mContainer, mH2, mSection } from "@/lib/marketing-layout";

export function CTASection() {
  return (
    <MarketingReveal className={`${mSection} border-t border-white/[0.06]`}>
      <div className={`${mContainer} text-center`}>
        <h2 className={mH2}>Bring your next project to Smohix</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Tell us what you need to build, integrate, or improve. We’ll help define a focused engagement.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <TrackableLink href="/contact?inquiry=pilot" event="start_pilot" className={buttonClassName({ size: "lg" })}>Apply for a pilot</TrackableLink>
          <TrackableLink href="/contact" event="contact_submit" className={buttonClassName({ size: "lg", variant: "secondary" })}>Contact us</TrackableLink>
        </div>
        <Link href="/professional-services" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">Explore professional services →</Link>
      </div>
    </MarketingReveal>
  );
}
