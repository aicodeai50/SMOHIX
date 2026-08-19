import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { Button } from "@/components/ui/Button";
import { FLAGSHIP_PRODUCTS } from "@/lib/ecosystem-workspaces";
import {
  mBody,
  mCardMotion,
  mContainer,
  mEyebrow,
  mFocusRing,
  mH2,
  mLede,
  mProductGrid,
  mSection,
  mStaggerGrid,
} from "@/lib/marketing-layout";

/** Homepage flagship product row — AI, Platform, Assistant, Smohix PRI. */
export function FlagshipProductsSection() {
  return (
    <MarketingReveal className={mSection} aria-labelledby="flagship-products-heading">
      <div className={mContainer}>
        <p className={`${mEyebrow} text-accent/90`}>Products</p>
        <h2 id="flagship-products-heading" className={`mt-2 ${mH2}`}>
          Workspaces in one ecosystem
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Smohix.run is headquarters. Each product opens a workspace — same company, same identity,
          never a disconnected microsite.
        </p>
        <div className={`mt-10 ${mProductGrid} ${mStaggerGrid}`}>
          {FLAGSHIP_PRODUCTS.map((product) => (
            <article
              key={product.id}
              className={`flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-6 ${mCardMotion} hover:border-accent/30`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                <MaturityBadge maturity={product.status} />
              </div>
              <p className={`mt-3 flex-1 ${mBody}`}>{product.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={product.href} className={mFocusRing}>
                  <Button size="sm" variant="secondary">
                    Overview
                  </Button>
                </Link>
                <a
                  href={product.workspaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={mFocusRing}
                >
                  <Button size="sm">Open workspace ↗</Button>
                </a>
              </div>
            </article>
          ))}
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
