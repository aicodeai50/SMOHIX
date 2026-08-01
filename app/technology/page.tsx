import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { TECHNOLOGY_STACK } from "@/lib/ecosystem-graph";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mH3, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Technology",
  description: `Frontend, backend, infrastructure, AI layer, and security stack powering ${SITE_COMPANY_NAME} — no secrets exposed.`,
  path: "/technology",
});

export default function TechnologyPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Stack</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Technology
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              High-level overview of how {SITE_COMPANY_NAME} is built. Environment variables and
              private URLs are configured at deploy time — never committed to this repository.
            </p>
          </div>
        </section>

        <section className={`${mSection} pb-16`}>
          <div className={`${mContainer} grid gap-5 sm:grid-cols-2 lg:grid-cols-3`}>
            {TECHNOLOGY_STACK.map((block) => (
              <article
                key={block.category}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/25"
              >
                <h2 className={mH3}>{block.category}</h2>
                <ul className={`mt-4 space-y-2 ${mBody}`}>
                  {block.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-accent" aria-hidden>
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className={`${mContainer} mt-12 flex flex-wrap gap-3`}>
            <Link
              href="/architecture"
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40"
            >
              System architecture →
            </Link>
            <Link
              href="/developers"
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40"
            >
              Developer hub →
            </Link>
            <Link
              href="/security"
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40"
            >
              Security →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
