import Link from "next/link";

import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import type { ProductPageContent } from "@/lib/ecosystem-graph";
import { getProductConversion, maturityCtaHint } from "@/lib/product-conversion";
import { getRegistryProduct, registryMaturityLabel, SMOHIX_AI_PUBLIC_URL } from "@/lib/product-registry";
import { mBody, mH3, mLinkInline } from "@/lib/marketing-layout";

export function ProductExperienceSections({ product }: { product: ProductPageContent }) {
  const registry = getRegistryProduct(product.slug);
  const conversion = getProductConversion(product.slug);

  if (!registry) return null;

  return (
    <div className="space-y-10 border-t border-white/[0.08] pt-10">
      <section aria-labelledby="availability-heading">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="availability-heading" className={mH3}>
            Current availability
          </h2>
          <MaturityBadge maturity={product.maturity} />
        </div>
        <p className={`mt-2 ${mBody}`}>{maturityCtaHint(product.maturity)}</p>
        <p className={`mt-2 ${mBody}`}>
          Registry maturity: <strong>{registryMaturityLabel(registry.maturity)}</strong>
          {registry.lastVerifiedAt ? ` · Last reviewed ${registry.lastVerifiedAt}` : null}
        </p>
      </section>

      {product.slug === "smohix-ai" ? (
        <section aria-labelledby="ai-product-heading">
          <h2 id="ai-product-heading" className={mH3}>
            Open Smohix AI
          </h2>
          <p className={`mt-3 ${mBody}`}>
            Smohix AI is a standalone product at{" "}
            <a href={SMOHIX_AI_PUBLIC_URL} className={mLinkInline} target="_blank" rel="noopener noreferrer">
              {SMOHIX_AI_PUBLIC_URL}
            </a>
            . Console Copilot at{" "}
            <Link href="/auth/sign-in?next=/copilot" className={mLinkInline}>
              /copilot
            </Link>{" "}
            uses same-origin API routes — API keys are never exposed in the browser.
          </p>
          <ul className={`mt-4 space-y-2 ${mBody}`}>
            {registry.limitations.map((l) => (
              <li key={l} className="flex gap-2">
                <span className="text-muted" aria-hidden>
                  ·
                </span>
                {l}
              </li>
            ))}
          </ul>
          <Link href="/privacy" className={`mt-4 inline-block text-sm ${mLinkInline}`}>
            Privacy & usage →
          </Link>
        </section>
      ) : null}

      {conversion ? (
        <section aria-labelledby="works-today-detail-heading">
          <h2 id="works-today-detail-heading" className={mH3}>
            What works today
          </h2>
          <ul className={`mt-3 space-y-2 ${mBody}`}>
            {conversion.worksToday.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-accent" aria-hidden>
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="capabilities-heading">
        <h2 id="capabilities-heading" className={mH3}>
          Key capabilities
        </h2>
        <ul className={`mt-3 space-y-2 ${mBody}`}>
          {registry.capabilities.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="text-accent" aria-hidden>
                ·
              </span>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="limitations-heading">
        <h2 id="limitations-heading" className={mH3}>
          Known limitations
        </h2>
        <ul className={`mt-3 space-y-2 ${mBody}`}>
          {registry.limitations.map((l) => (
            <li key={l} className="flex gap-2">
              <span className="text-muted" aria-hidden>
                ·
              </span>
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="real-actions-heading">
        <h2 id="real-actions-heading" className={mH3}>
          Access this product
        </h2>
        <ul className={`mt-3 space-y-2 ${mBody}`}>
          {registry.availableActions.map((action) => (
            <li key={`${action.kind}-${action.href}`}>
              {action.external ? (
                <a href={action.href} className={mLinkInline} target="_blank" rel="noopener noreferrer">
                  {action.label} ↗
                </a>
              ) : (
                <Link href={action.href} className={mLinkInline}>
                  {action.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dev-integration-heading">
        <h2 id="dev-integration-heading" className={mH3}>
          Developer integration
        </h2>
        <ul className={`mt-3 space-y-2 ${mBody}`}>
          {product.developerApis.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className={mLinkInline}>
                {a.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/developers" className={`mt-4 inline-block text-sm ${mLinkInline}`}>
          Developer hub →
        </Link>
      </section>
    </div>
  );
}
