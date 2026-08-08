import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { getMailtoHref } from "@/lib/billing";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mArticle, mBody, mContainer, mEyebrow, mH1, mH2, mSection } from "@/lib/marketing-layout";
import {
  SITE_BRAND_NAME,
  SITE_LEGAL_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_TAGLINE,
} from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: `About ${SITE_BRAND_NAME}`,
  description: `${SITE_BRAND_NAME} builds the enterprise command platform for incident response, cybersecurity operations, and compliance evidence — ${SITE_TAGLINE}`,
  path: "/about",
});

const VALUES = [
  {
    title: "Human-in-the-loop by default",
    body: "Automation stops at approval gates and dry-runs. Production changes require explicit authorization and leave an audit trail.",
  },
  {
    title: "Evidence over narrative",
    body: "Timelines, exports, assessor workbooks, and webhook delivery logs — built for SOC 2, ISO, and enterprise procurement.",
  },
  {
    title: "Ship like operators",
    body: "Migrations, regression suites, and governance cron jobs ship continuously. The product reflects how platform and security teams actually work.",
  },
  {
    title: "One console, many disciplines",
    body: "Platform engineering, SOC, SRE, and GRC share the same incident queue, automation posture, and compliance program — not four tools duct-taped together.",
  },
] as const;

export default function AboutPage() {
  const salesHref = getMailtoHref("enterprise");

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingQuantumShell>
          <section className={`smohix-hero-future border-b border-white/[0.06] ${mSection}`}>
            <article className={`${mArticle} ${mContainer}`}>
              <p className={`${mEyebrow} smohix-eyebrow-cyber`}>Company</p>
              <h1 className={`mt-2 smohix-headline smohix-living-headline ${mH1}`}>
                About {SITE_BRAND_NAME}
              </h1>
              <p className={`mt-4 max-w-3xl text-base sm:text-lg ${mBody}`}>
                {SITE_LEGAL_NAME} builds {SITE_BRAND_NAME} — {SITE_MARKETING_DESCRIPTION}
              </p>
            </article>
          </section>

          <section className={mSection}>
            <div className={mContainer}>
              <h2 className={mH2}>What we believe</h2>
              <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                {VALUES.map((value) => (
                  <li
                    key={value.title}
                    className="smohix-bento-cell rounded-2xl p-6"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{value.title}</h3>
                    <p className={`mt-2 ${mBody}`}>{value.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={`border-t border-white/[0.06] ${mSection}`}>
            <div className={`${mContainer} flex flex-wrap items-center gap-4`}>
              <Link
                href="/enterprise"
                className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-background hover:opacity-90"
              >
                Enterprise overview
              </Link>
              <a
                href={salesHref}
                className="inline-flex h-11 items-center rounded-lg border border-white/[0.12] px-5 text-sm font-medium text-foreground/90 hover:border-accent/35"
              >
                Talk to sales
              </a>
              <Link
                href="/careers"
                className="inline-flex h-11 items-center rounded-lg border border-white/[0.12] px-5 text-sm font-medium text-muted hover:text-foreground"
              >
                Careers
              </Link>
            </div>
          </section>
        </MarketingQuantumShell>
      </main>
      <Footer />
    </>
  );
}
