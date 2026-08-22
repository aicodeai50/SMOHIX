import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { EcosystemConstellation } from "@/components/landing/EcosystemConstellation";
import {
  mBody,
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mSection,
} from "@/lib/marketing-layout";

/** Homepage flagship product row — ecosystem constellation, not equal card grid. */
export function FlagshipProductsSection() {
  return (
    <MarketingReveal
      className={`${mSection} smohix-section-approach`}
      aria-labelledby="flagship-products-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-accent/80`}>Products</p>
        <h2 id="flagship-products-heading" className={`mt-2 ${mH2}`}>
          Workspaces in one architecture
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Smohix.run is headquarters. Each product opens a workspace — same company, same identity.
          Status labels show what is live, in preview, or planned.
        </p>

        <div className="mt-10">
          <EcosystemConstellation />
        </div>

        <p className={`mt-8 ${mBody}`}>
          <Link href="/products" className="font-medium text-accent hover:underline">
            View all products and maturity labels →
          </Link>
        </p>
      </div>
    </MarketingReveal>
  );
}
