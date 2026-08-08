import type { Metadata } from "next";
import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { USE_CASES } from "@/lib/experience/use-cases";
import { buildMarketingMetadata } from "@/lib/metadata";
import {
  mBody,
  mCard,
  mContainer,
  mEyebrow,
  mH1,
  mLede,
  mLinkInline,
  mSection,
  mStaggerGrid,
} from "@/lib/marketing-layout";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Use cases",
  description:
    "Scenario-based solutions for healthcare, enterprise, developers, and operations — with current availability and pilot requirements.",
  path: "/use-cases",
});

export default function UseCasesPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingReveal className={mSection}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Use cases</p>
            <h1 className={mH1}>How teams use Smohix</h1>
            <p className={mLede}>
              Problem → solution → products → what is available now vs pilot vs planned. No invented
              customer stories or proven outcome claims.
            </p>
            <Link href="/products" className={`mt-4 inline-block text-sm ${mLinkInline}`}>
              Product Access →
            </Link>
          </div>
        </MarketingReveal>
        <MarketingReveal className={`${mSection} pb-16`}>
          <div className={`${mContainer} grid gap-6 lg:grid-cols-2 ${mStaggerGrid}`}>
            {USE_CASES.map((uc) => (
              <article key={uc.id} className={mCard}>
                <h2 className="text-lg font-semibold text-foreground">{uc.title}</h2>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-muted">
                  Problem
                </h3>
                <p className={`mt-2 ${mBody}`}>{uc.problem}</p>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-muted">
                  Solution
                </h3>
                <p className={`mt-2 ${mBody}`}>{uc.solution}</p>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-muted">
                  Products
                </h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {uc.products.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/products/${p.slug}`}
                        className="rounded-full border border-white/[0.12] px-2.5 py-1 text-xs font-medium text-accent hover:border-accent/40"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-muted">
                  Delivers now
                </h3>
                <ul className={`mt-2 space-y-1 ${mBody}`}>
                  {uc.deliversNow.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
                {uc.requiresPilot.length > 0 ? (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-muted">
                      Requires pilot
                    </h3>
                    <ul className={`mt-2 space-y-1 ${mBody}`}>
                      {uc.requiresPilot.map((d) => (
                        <li key={d}>· {d}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {uc.planned.length > 0 ? (
                  <>
                    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-muted">
                      Planned
                    </h3>
                    <ul className={`mt-2 space-y-1 ${mBody}`}>
                      {uc.planned.map((d) => (
                        <li key={d}>· {d}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <Link href="/contact" className={`mt-6 inline-block text-sm ${mLinkInline}`}>
                  Contact →
                </Link>
              </article>
            ))}
          </div>
        </MarketingReveal>
      </main>
      <Footer />
    </>
  );
}
