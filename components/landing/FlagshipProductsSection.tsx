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
      id="ecosystem"
      className={`${mSection} smohix-section-approach`}
      aria-labelledby="flagship-products-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-accent/80`}>Products</p>
        <h2 id="flagship-products-heading" className={`mt-2 ${mH2}`}>
          Workspaces in one architecture
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Smohix.run is headquarters. Choose a workspace for your work — intelligence, operations,
          personal productivity, private processing or company project delivery.
          Products share the Smohix identity; account access and synchronization vary by product.
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
