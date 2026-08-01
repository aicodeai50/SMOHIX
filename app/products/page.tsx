import type { Metadata } from "next";
import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ECOSYSTEM_PRODUCTS } from "@/lib/company-identity";
import { maturityLabel } from "@/lib/ecosystem-graph";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Products",
  description: `${SITE_COMPANY_NAME} product portfolio — Zentro Platform, Zentro AI, Zentro Own API, and upcoming ecosystem capabilities.`,
  path: "/products",
});

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Products</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              The Zentro ecosystem
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              Platforms, APIs, and tools built by {SITE_COMPANY_NAME}. Maturity labels are honest —
              live, preview, prototype, or coming soon.
            </p>
            <Link
              href="/#ecosystem"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              View interactive ecosystem map →
            </Link>
          </div>
        </section>
        <section className={`${mSection}`}>
          <div className={`${mContainer} grid gap-5 sm:grid-cols-2 lg:grid-cols-3`}>
            {ECOSYSTEM_PRODUCTS.map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-accent/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <AppIcon name={product.icon} size={22} className="text-primary-muted" />
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      product.status === "live"
                        ? "border border-accent/30 bg-accent-dim text-accent"
                        : product.status === "preview" || product.status === "prototype"
                          ? "border border-warning/30 bg-warning-dim text-warning"
                          : "border border-white/[0.12] text-muted"
                    }`}
                  >
                    {maturityLabel(product.status)}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-foreground">{product.name}</h2>
                <p className={`mt-2 flex-1 ${mBody}`}>{product.description}</p>
                <span className="mt-4 text-sm font-medium text-accent">View →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
