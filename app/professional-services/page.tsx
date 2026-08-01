import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarketingJsonLd, servicesPageJsonLd } from "@/components/site/MarketingJsonLd";
import { Button } from "@/components/ui/Button";
import { buildMarketingMetadata } from "@/lib/metadata";
import { ZENTRO_SERVICES } from "@/lib/services-content";
import { mBody, mContainer, mEyebrow, mH3, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

/** Public professional services — not the authenticated console service catalog at /services. */
export const metadata: Metadata = buildMarketingMetadata({
  title: "Professional Services",
  description: `${SITE_COMPANY_NAME} services — AI integration, automation, API development, and prototyping alongside the Zentro product ecosystem.`,
  path: "/professional-services",
});

export default function ProfessionalServicesPage() {
  const serviceNames = ZENTRO_SERVICES.map((s) => s.title);

  return (
    <>
      <MarketingJsonLd graph={servicesPageJsonLd(serviceNames)} />
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Professional services</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Work with {SITE_COMPANY_NAME}
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              Professional services generate real outcomes while the product ecosystem
              matures. Pricing is scoped per engagement — nothing on this page is a list
              price or quote. For the authenticated{" "}
              <Link href="/auth/sign-in?next=/services" className="text-accent hover:underline">
                service catalog
              </Link>{" "}
              in the console, sign in and open Services.
            </p>
            <Link href="/pilot" className="mt-8 inline-block">
              <Button size="lg">Start a pilot</Button>
            </Link>
          </div>
        </section>

        <section className={`${mSection} pb-16`}>
          <div className={`${mContainer} grid gap-5 lg:grid-cols-2`}>
            {ZENTRO_SERVICES.map((service) => (
              <article
                key={service.id}
                className="flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
              >
                <h2 className={mH3}>{service.title}</h2>
                <div className={`mt-4 space-y-3 ${mBody}`}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-muted">
                      Problem
                    </p>
                    <p className="mt-1">{service.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-muted">
                      Typical outcome
                    </p>
                    <p className="mt-1">{service.outcome}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-muted">
                      Who it is for
                    </p>
                    <p className="mt-1">{service.audience}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-muted">
                      Related products
                    </p>
                    <p className="mt-1">{service.relatedProducts.join(" · ")}</p>
                  </div>
                </div>
                <Link
                  href={`/contact?inquiry=pilot&product=${encodeURIComponent(service.id)}`}
                  className="mt-6 text-sm font-medium text-accent hover:underline"
                >
                  Start a pilot for this →
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
