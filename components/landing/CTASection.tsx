import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Button } from "@/components/ui/Button";
import { mContainer, mH2, mSection } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export function CTASection() {
  return (
    <MarketingReveal className={`${mSection} border-t border-white/[0.06]`}>
      <div className={`${mContainer} text-center`}>
        <h2 className={mH2}>Ready to run accountable operations?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Start with the free tier, then upgrade via PayPal when your team is
          ready for production automation and audit export.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/auth/sign-in?next=/hub">
            <Button size="lg">Get started with {SITE_BRAND_NAME}</Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="secondary">
              Compare plans
            </Button>
          </Link>
        </div>
      </div>
    </MarketingReveal>
  );
}
