import Link from "next/link";

import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { buttonClassName } from "@/components/ui/Button";
import { mBody, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";

export function CommercialOpportunitySection() {
  return (
    <MarketingReveal
      id="work-with-smohix"
      className={`${mSection} border-y border-white/[0.06] bg-white/[0.01]`}
      aria-labelledby="commercial-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Work with us</p>
        <h2 id="commercial-heading" className={mH2}>
          Pilots and services while the ecosystem matures
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Not every capability is GA yet — Smohix Technologies offers scoped pilots and
          professional services so you can move forward with honest expectations.
        </p>

        <CommercialPaths className="mt-10" />

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/pilot" className={buttonClassName({  })}>Pilot program</Link>
          <Link href="/professional-services" className={buttonClassName({ variant: "secondary" })}>Professional services</Link>
        </div>

        <p className={`mt-6 text-sm ${mBody}`}>
          Enterprise procurement? See{" "}
          <Link href="/enterprise" className="text-accent hover:underline">
            Enterprise
          </Link>{" "}
          or{" "}
          <Link href="/contact?inquiry=enterprise" className="text-accent hover:underline">
            contact sales
          </Link>
          .
        </p>
      </div>
    </MarketingReveal>
  );
}
