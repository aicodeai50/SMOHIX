import type { Metadata } from "next";
import Link from "next/link";

import { ContactFormSection } from "@/components/contact/ContactFormSection";
import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarketingJsonLd, contactPageJsonLd } from "@/components/site/MarketingJsonLd";
import { getMailtoHref, SITE_EMAIL_CONTACT } from "@/lib/billing";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Contact",
  description: `Contact ${SITE_COMPANY_NAME} — pilot applications, enterprise, developers, partnerships, and product questions.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <MarketingJsonLd graph={contactPageJsonLd()} />
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Contact</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Get in touch
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              Submit a qualified inquiry below. We use a mailto fallback until server-side
              intake is connected — your email client will open with a pre-filled message.
            </p>
            <p className={`mt-4 text-sm ${mBody}`}>
              Prefer email directly?{" "}
              <a
                href={getMailtoHref("general")}
                className="font-mono text-accent underline-offset-2 hover:underline"
              >
                {SITE_EMAIL_CONTACT}
              </a>
            </p>
          </div>
        </section>

        <section className={mSection}>
          <div className={`${mContainer} grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]`}>
            <ContactFormSection />
            <aside className="space-y-8">
              <CommercialPaths compact />
              <div className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 ${mBody}`}>
                <h2 className="font-semibold text-foreground">Other channels</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    <Link href="/pilot" className="text-accent hover:underline">
                      Pilot program →
                    </Link>
                  </li>
                  <li>
                    <Link href="/status" className="text-accent hover:underline">
                      System status →
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="text-accent hover:underline">
                      Documentation →
                    </Link>
                  </li>
                  <li>
                    <a href={getMailtoHref("security")} className="text-accent hover:underline">
                      Security disclosure →
                    </a>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
