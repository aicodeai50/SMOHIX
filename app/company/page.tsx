import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  COMPANY_MISSION,
  COMPANY_NAME,
  COMPANY_VISION,
} from "@/lib/company-identity";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME, SITE_LEGAL_NAME, SITE_TAGLINE } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Company",
  description: `${SITE_COMPANY_NAME} — mission, vision, and links to about, careers, and contact.`,
  path: "/company",
});

const COMPANY_LINKS = [
  { href: "/about", label: "About", detail: "Values, story, and product direction." },
  { href: "/careers", label: "Careers", detail: "Join the team building the Zentro ecosystem." },
  { href: "/contact", label: "Contact", detail: "Reach product, support, and partnerships." },
  { href: "/trust", label: "Trust", detail: "Governance and security posture." },
  { href: "/changelog", label: "Changelog", detail: "Shipped improvements and fixes." },
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
              {SITE_LEGAL_NAME} operates {SITE_COMPANY_NAME} at zentro.run — {SITE_TAGLINE}
            </p>
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
          </div>
        </section>
        <section className={mSection}>
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
