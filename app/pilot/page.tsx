import type { Metadata } from "next";
import Link from "next/link";

import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarketingJsonLd, pilotPageJsonLd } from "@/components/site/MarketingJsonLd";
import { Button } from "@/components/ui/Button";
import { buildMarketingMetadata } from "@/lib/metadata";
import {
  PILOT_AUDIENCE,
  PILOT_CATEGORIES,
  PILOT_DELIVERABLES,
  PILOT_PROCESS,
  PILOT_SECURITY_PRINCIPLES,
} from "@/lib/pilot-program";
import { mBody, mContainer, mEyebrow, mH3, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Pilot Program",
  description: `Work with ${SITE_COMPANY_NAME} on scoped AI, automation, and integration pilots before full product maturity.`,
  path: "/pilot",
});

export default function PilotPage() {
  return (
    <>
      <MarketingJsonLd graph={pilotPageJsonLd()} />
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Pilot program</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Start a Zentro pilot
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              A pilot is a scoped collaboration with {SITE_COMPANY_NAME} — using live,
              preview, and prototype capabilities on zentro.run with honest maturity labels.
              We do not promise fixed delivery timelines; each charter defines scope and rhythm.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact?inquiry=pilot">
                <Button size="lg">Apply for a pilot</Button>
              </Link>
              <Link href="/professional-services">
                <Button size="lg" variant="secondary">
                  View services
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className={mSection}>
          <div className={mContainer}>
            <h2 className={mH3}>Who it is for</h2>
            <ul className={`mt-4 space-y-2 ${mBody}`}>
              {PILOT_AUDIENCE.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ·
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <h2 className={mH3}>Pilot categories</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {PILOT_CATEGORIES.map((cat) => (
                <li
                  key={cat.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
                >
                  <h3 className="font-semibold text-foreground">{cat.title}</h3>
                  <p className={`mt-2 ${mBody}`}>{cat.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={mSection}>
          <div className={`${mContainer} grid gap-10 lg:grid-cols-2`}>
            <div>
              <h2 className={mH3}>What you receive</h2>
              <ul className={`mt-4 space-y-2 ${mBody}`}>
                {PILOT_DELIVERABLES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className={mH3}>Collaboration process</h2>
              <ol className={`mt-4 list-inside list-decimal space-y-2 ${mBody}`}>
                {PILOT_PROCESS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06] bg-white/[0.01]`}>
          <div className={mContainer}>
            <h2 className={mH3}>Security and privacy principles</h2>
            <ul className={`mt-4 space-y-2 ${mBody}`}>
              {PILOT_SECURITY_PRINCIPLES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className={`mt-6 ${mBody}`}>
              Read the full{" "}
              <Link href="/trust" className="text-accent hover:underline">
                trust center
              </Link>{" "}
              — we do not claim SOC 2, ISO, HIPAA, or regulatory approval on this site.
            </p>
          </div>
        </section>

        <section className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <CommercialPaths compact />
            <div className="mt-8">
              <Link href="/contact?inquiry=pilot">
                <Button size="lg">Submit pilot application</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
