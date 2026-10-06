import Link from "next/link";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { COMPANY_MISSION, COMPANY_NAME, COMPANY_ORIGIN } from "@/lib/company-identity";
import { mBody, mContainer, mEyebrow, mH2, mSection } from "@/lib/marketing-layout";

export function AboutCompanySection() {
  return (
    <MarketingReveal id="about" className={mSection} aria-labelledby="about-heading">
      <div className={`${mContainer} grid gap-6 md:grid-cols-2 md:gap-14`}>
        <div>
          <p className={`${mEyebrow} text-primary-muted`}>About {COMPANY_NAME}</p>
          <h2 id="about-heading" className={`mt-2 ${mH2}`}>Engineering with a long view</h2>
        </div>
        <div>
          <p className={mBody}>{COMPANY_ORIGIN}</p>
          <p className={`mt-4 ${mBody}`}>{COMPANY_MISSION}</p>
          <Link href="/company" className="mt-5 inline-block text-sm font-semibold text-accent hover:underline">Meet the company →</Link>
        </div>
      </div>
    </MarketingReveal>
  );
}
