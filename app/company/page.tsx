import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  COMPANY_MISSION,
  COMPANY_NAME,
  COMPANY_ORIGIN,
  COMPANY_TECHNOLOGY_PHILOSOPHY,
  COMPANY_VISION,
  ECOSYSTEM_PRODUCTS,
} from "@/lib/company-identity";
import { SMOHIX_WORKSPACE_URLS } from "@/lib/ecosystem-workspaces";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mH3, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME, SITE_LEGAL_NAME, SITE_TAGLINE } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Company",
  description: `${SITE_COMPANY_NAME} — mission, vision, Norwegian engineering roots, and the Smohix product ecosystem.`,
  path: "/company",
});

const COMPANY_LINKS = [
  { href: "/about", label: "About", detail: "Values, story, and product direction." },
  { href: "/careers", label: "Careers", detail: "Join the team building the Smohix ecosystem." },
  { href: "/contact", label: "Contact", detail: "Product, partnerships, and support." },
  { href: "/trust", label: "Trust", detail: "Security, privacy, and maturity disclosure." },
  { href: "/technology", label: "Technology", detail: "How we build — executive overview." },
  { href: "/changelog", label: "Changelog", detail: "Shipped improvements and fixes." },
] as const;

const WORKSPACES = [
  { label: "Headquarters", url: SMOHIX_WORKSPACE_URLS.headquarters },
  { label: "Smohix Platform", url: SMOHIX_WORKSPACE_URLS.platform },
  { label: "Smohix AI", url: SMOHIX_WORKSPACE_URLS.ai },
  { label: "Smohix Assistant", url: SMOHIX_WORKSPACE_URLS.assistant },
  { label: "Private AI", url: SMOHIX_WORKSPACE_URLS.privateAi },
  { label: "Smohix Log", url: SMOHIX_WORKSPACE_URLS.log },
] as const;

export default function CompanyPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Company</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {COMPANY_NAME}
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              {SITE_LEGAL_NAME} operates {SITE_COMPANY_NAME} at smohix.run — {SITE_TAGLINE}
            </p>
            <p className={`mt-3 max-w-2xl ${mBody}`}>{COMPANY_ORIGIN}</p>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-muted">
                  Mission
                </h2>
                <p className={`mt-3 ${mBody} text-foreground/90`}>{COMPANY_MISSION}</p>
              </article>
              <article className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-muted">
                  Vision
                </h2>
                <p className={`mt-3 ${mBody} text-foreground/90`}>{COMPANY_VISION}</p>
              </article>
            </div>

            <article className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-muted">
                Technology philosophy
              </h2>
              <p className={`mt-3 ${mBody} text-foreground/90`}>{COMPANY_TECHNOLOGY_PHILOSOPHY}</p>
            </article>
          </div>
        </section>

        <section className={`${mSection} border-b border-white/[0.06] bg-white/[0.01]`}>
          <div className={mContainer}>
            <h2 className={mH3}>Ecosystem workspaces</h2>
            <p className={`mt-2 max-w-2xl ${mBody}`}>
              Public domains are workspaces inside one company — not independent products or
              separate companies.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {WORKSPACES.map((ws) => (
                <li
                  key={ws.url}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-foreground">{ws.label}</p>
                  <a
                    href={ws.url}
                    className="mt-1 block font-mono text-xs text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ws.url.replace("https://", "")}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <h2 className={mH3}>Product ecosystem</h2>
            <ul className={`mt-6 grid gap-3 sm:grid-cols-2 ${mBody}`}>
              {ECOSYSTEM_PRODUCTS.map((product) => (
                <li key={product.id}>
                  <Link href={product.href} className="font-medium text-accent hover:underline">
                    {product.name}
                  </Link>
                  <span className="text-muted"> — {product.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${mSection} pb-16`}>
          <div className={`${mContainer} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
            {COMPANY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-[border-color] hover:border-accent/30"
              >
                <h2 className="font-semibold text-foreground">{item.label}</h2>
                <p className={`mt-2 ${mBody}`}>{item.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
