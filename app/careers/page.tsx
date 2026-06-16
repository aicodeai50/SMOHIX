import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { getMailtoHref } from "@/lib/billing";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mArticle, mBody, mContainer, mEyebrow, mH1, mSection } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: `Careers at ${SITE_BRAND_NAME}`,
  description: `Join ${SITE_BRAND_NAME} — we build enterprise AI operations and cybersecurity software for platform, SOC, SRE, and GRC teams.`,
  path: "/careers",
});

const ROLES = [
  {
    title: "Senior platform engineer",
    location: "Remote · Americas / EMEA",
    detail: "Console performance, Supabase migrations, and release verification for a high-trust operations product.",
  },
  {
    title: "Security engineer",
    location: "Remote",
    detail: "Threat modeling, connector hardening, and customer-facing security documentation.",
  },
  {
    title: "GRC product specialist",
    location: "Remote",
    detail: "Compliance frameworks, assessor workflows, and enterprise evidence exports.",
  },
] as const;

export default function CareersPage() {
  const hiringHref = getMailtoHref("enterprise");

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingQuantumShell>
          <section className={`zentro-hero-future border-b border-white/[0.06] ${mSection}`}>
            <article className={`${mArticle} ${mContainer}`}>
              <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Careers</p>
              <h1 className={`mt-2 ${mH1}`}>Build operational software that security teams trust</h1>
              <p className={`mt-4 max-w-2xl ${mBody}`}>
                {SITE_BRAND_NAME} is a product company focused on incident command, guarded automation,
                and compliance evidence. We hire operators who care about audit trails as much as uptime.
              </p>
            </article>
          </section>

          <section className={mSection}>
            <div className={mContainer}>
              <ul className="space-y-4">
                {ROLES.map((role) => (
                  <li
                    key={role.title}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6"
                  >
                    <h2 className="text-base font-semibold text-foreground">{role.title}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
                      {role.location}
                    </p>
                    <p className={`mt-3 ${mBody}`}>{role.detail}</p>
                  </li>
                ))}
              </ul>
              <p className={`mt-8 ${mBody}`}>
                No matching role?{" "}
                <a href={hiringHref} className="font-medium text-accent hover:underline">
                  Email us your background
                </a>
                .
              </p>
            </div>
          </section>
        </MarketingQuantumShell>
      </main>
      <Footer />
    </>
  );
}
