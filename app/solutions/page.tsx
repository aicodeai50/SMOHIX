import type { Metadata } from "next";
import Link from "next/link";

import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { AUDIENCE_SEGMENTS } from "@/lib/company-identity";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Solutions",
  description: `${SITE_COMPANY_NAME} solutions for developers, businesses, healthcare, enterprise, government, and education.`,
  path: "/solutions",
});

export default function SolutionsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Solutions</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for your context
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              {SITE_COMPANY_NAME} serves teams across industries — with live enterprise
              offerings today and vertical solutions expanding over time.
            </p>
          </div>
        </section>
        <section className={mSection}>
          <div className={`${mContainer} grid gap-5 sm:grid-cols-2 lg:grid-cols-3`}>
            {AUDIENCE_SEGMENTS.map((segment) => (
              <Link
                key={segment.id}
                href={segment.href}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-accent/30"
              >
                <h2 className="text-lg font-semibold text-foreground">{segment.title}</h2>
                <p className={`mt-2 ${mBody}`}>{segment.description}</p>
                <span className="mt-4 inline-block text-sm font-medium text-accent">
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <CommercialPaths compact />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
