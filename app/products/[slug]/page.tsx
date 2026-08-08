import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppIcon } from "@/components/icons/AppIcon";
import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { ProductDetailContent } from "@/components/products/ProductDetailContent";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getComingSoonProduct } from "@/lib/company-identity";
import {
  getAllProductSlugs,
  getProductBySlug,
  maturityLabel,
  PLATFORM_NODE_MAP,
} from "@/lib/ecosystem-graph";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mH1, mSection } from "@/lib/marketing-layout";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return buildMarketingMetadata({
      title: "Product",
      description: "Smohix Technologies product.",
      path: `/products/${slug}`,
    });
  }
  return buildMarketingMetadata({
    title: product.name,
    description: `${product.tagline} — ${maturityLabel(product.maturity)} on the Smohix platform.`,
    path: `/products/${slug}`,
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const node = product.nodeId ? PLATFORM_NODE_MAP.get(product.nodeId) : undefined;
  const legacy = getComingSoonProduct(slug);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Products · Platform capability</p>
            <div className="mt-2 flex flex-wrap items-start gap-4">
              {node ? (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                  <AppIcon name={node.icon} size={24} className="text-primary-muted" aria-hidden />
                </div>
              ) : null}
              <div>
                <h1 className={mH1}>{product.name}</h1>
                <p className={`mt-3 max-w-2xl ${mBody}`}>{product.tagline}</p>
                <div className="mt-4">
                  <MaturityBadge maturity={product.maturity} size="md" />
                </div>
                {legacy && product.maturity === "coming-soon" ? (
                  <p className={`mt-3 text-sm ${mBody} text-muted`}>{legacy.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
        <section className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <ProductDetailContent product={product} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
