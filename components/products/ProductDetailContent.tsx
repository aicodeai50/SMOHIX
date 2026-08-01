import { ProductExperienceSections } from "@/components/experience/ProductExperienceSections";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import type { ProductPageContent } from "@/lib/ecosystem-graph";
import { PLATFORM_NODE_MAP } from "@/lib/ecosystem-graph";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import {
  getMaturityCtas,
  getProductConversion,
  maturityCtaHint,
} from "@/lib/product-conversion";
import { mBody, mH3 } from "@/lib/marketing-layout";
import { Button } from "@/components/ui/Button";

function RelationshipList({
  title,
  items,
  linkPrefix,
}: {
  title: string;
  items: readonly { id?: string; slug?: string; label?: string; name?: string; href?: string }[];
  linkPrefix?: "node" | "slug" | "href";
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className={`${mH3} text-sm`}>{title}</h3>
      <ul className={`mt-3 space-y-2 ${mBody}`}>
        {items.map((item) => {
          let href = "#";
          const label = item.label ?? item.name ?? "";
          if (linkPrefix === "node" && item.id) {
            const node = PLATFORM_NODE_MAP.get(item.id as import("@/lib/ecosystem-graph").PlatformNodeId);
            href = node?.href ?? `/products/${item.id}`;
          } else if (linkPrefix === "slug" && item.slug) {
            href = `/products/${item.slug}`;
          } else if (item.href) {
            href = item.href;
          }
          return (
            <li key={label}>
              <TrackableLink
                href={href}
                event="documentation_link"
                payload={{ label }}
                className="text-accent hover:underline"
              >
                {label}
              </TrackableLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ProductRelationships({ product }: { product: ProductPageContent }) {
  return (
    <aside
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 lg:sticky lg:top-24"
      aria-label="Product relationships"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-muted">
        Connected capabilities
      </p>

      <div className="mt-6 space-y-6">
        <RelationshipList title="Uses" items={product.uses} linkPrefix="node" />
        <RelationshipList title="Works with" items={product.worksWith} linkPrefix="node" />
        <div>
          <h3 className={`${mH3} text-sm`}>Integrates with</h3>
          <ul className={`mt-3 flex flex-wrap gap-2 ${mBody}`}>
            {product.integratesWith.map((name) => (
              <li
                key={name}
                className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 text-xs text-foreground/85"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
        <RelationshipList
          title="Related products"
          items={product.relatedProducts.map((r) => ({ slug: r.slug, label: r.name }))}
          linkPrefix="slug"
        />
        <RelationshipList
          title="Developer APIs"
          items={product.developerApis.map((a) => ({ href: a.href, label: a.label }))}
          linkPrefix="href"
        />
        <RelationshipList
          title="Documentation"
          items={product.documentation.map((d) => ({ href: d.href, label: d.label }))}
          linkPrefix="href"
        />
      </div>

      <div className="mt-8 border-t border-white/[0.08] pt-6">
        <MaturityBadge maturity={product.maturity} size="md" />
        <p className={`mt-3 text-xs ${mBody}`}>{maturityCtaHint(product.maturity)}</p>
      </div>
    </aside>
  );
}

export function ProductDetailContent({ product }: { product: ProductPageContent }) {
  const conversion = getProductConversion(product.slug);
  const ctas = getMaturityCtas(product);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
      <div className="space-y-10">
        {conversion ? (
          <>
            <section aria-labelledby="audience-heading">
              <h2 id="audience-heading" className={mH3}>
                Who it is for
              </h2>
              <p className={`mt-3 ${mBody}`}>{conversion.audience}</p>
            </section>
            <section aria-labelledby="works-today-heading">
              <h2 id="works-today-heading" className={mH3}>
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
          </>
        ) : null}

        <section aria-labelledby="problem-heading">
          <h2 id="problem-heading" className={mH3}>
            Problem
          </h2>
          <p className={`mt-3 ${mBody}`}>{product.problem}</p>
        </section>
        <section aria-labelledby="solution-heading">
          <h2 id="solution-heading" className={mH3}>
            Solution
          </h2>
          <p className={`mt-3 ${mBody}`}>{product.solution}</p>
        </section>
        <section aria-labelledby="how-heading">
          <h2 id="how-heading" className={mH3}>
            How it works
          </h2>
          <ol className={`mt-3 list-inside list-decimal space-y-2 ${mBody}`}>
            {product.howItWorks.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="benefits-heading">
          <h2 id="benefits-heading" className={mH3}>
            Benefits
          </h2>
          <ul className={`mt-3 space-y-2 ${mBody}`}>
            {product.benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-accent" aria-hidden>
                  ·
                </span>
                {b}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="roadmap-heading">
          <h2 id="roadmap-heading" className={mH3}>
            Roadmap
          </h2>
          <ul className={`mt-3 space-y-2 ${mBody}`}>
            {product.roadmap.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-primary-muted" aria-hidden>
                  →
                </span>
                {r}
              </li>
            ))}
          </ul>
        </section>

        <ProductExperienceSections product={product} />
        <div className="flex flex-wrap gap-3 pt-2">
          <TrackableLink
            href={ctas.primary.href}
            event={ctas.primary.event}
            payload={{ product: product.slug, label: ctas.primary.label }}
          >
            <Button size="lg">{ctas.primary.label}</Button>
          </TrackableLink>
          {ctas.secondary ? (
            <TrackableLink
              href={ctas.secondary.href}
              event={ctas.secondary.event}
              payload={{ product: product.slug, label: ctas.secondary.label }}
            >
              <Button size="lg" variant="secondary">
                {ctas.secondary.label}
              </Button>
            </TrackableLink>
          ) : null}
        </div>

        <div className="border-t border-white/[0.08] pt-8">
          <CommercialPaths compact />
        </div>
      </div>
      <ProductRelationships product={product} />
    </div>
  );
}
