import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { buildMarketingMetadata } from "@/lib/metadata";
import {
  mBody,
  mContainer,
  mEyebrow,
  mH1,
  mLede,
  mSection,
} from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata = buildMarketingMetadata({
  title: `Why ${SITE_BRAND_NAME}`,
  description: `How ${SITE_BRAND_NAME} approaches incident command, guarded automation, and audit — built for teams who operate production under scrutiny.`,
  path: "/why",
});

const PRINCIPLES = [
  {
    title: "Coordination over noise",
    body: "Most failures are not unknown — they are unmanaged. Zentro gives responders one queue, one timeline, and one record of who decided what.",
  },
  {
    title: "Assistance with accountability",
    body: "Copilot drafts and suggests. It does not execute silently. Humans remain accountable at the points where production changes.",
  },
  {
    title: "Simulation before execution",
    body: "Dry-runs let teams agree on intent and blast radius before a connector runs. Guardrails turn ad-hoc scripts into recorded paths.",
  },
  {
    title: "Approvals as judgment",
    body: "Under stress, organizations need explicit decision points — not threads that scroll away. Approvals live beside the automation they gate.",
  },
  {
    title: "Evidence by default",
    body: "Append-only activity, export paths, and incident timelines give post-incident review material that survives the night shift.",
  },
  {
    title: "One surface, fewer handoffs",
    body: "Paging tools wake people up. ITSM suites span process breadth. Zentro focuses on the path from signal to verified change.",
  },
] as const;

export default function WhyPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingQuantumShell>
          <section className={`zentro-hero-future border-b border-white/[0.06] ${mSection}`}>
            <div className={mContainer}>
              <p className={mEyebrow}>Operating principles</p>
              <h1 className={`mt-2 max-w-3xl zentro-living-headline zentro-headline ${mH1}`}>
                Why {SITE_BRAND_NAME}
              </h1>
              <p className={`mt-4 max-w-2xl ${mLede}`}>
                We build for platform, SOC, and SRE teams who run production under audit pressure —
                not for slide-deck automation theater.
              </p>
            </div>
          </section>

          <section className={mSection}>
            <div className={mContainer}>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {PRINCIPLES.map((item) => (
                  <li
                    key={item.title}
                    className="zentro-bento-cell rounded-2xl border border-white/[0.08] p-6"
                  >
                    <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                    <p className={`mt-3 ${mBody}`}>{item.body}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-12 flex flex-wrap gap-4 border-t border-white/[0.06] pt-8 text-sm">
                <Link href="/platform" className="font-medium text-accent hover:underline">
                  Platform overview
                </Link>
                <Link href="/trust" className="font-medium text-muted hover:text-foreground">
                  Trust &amp; governance
                </Link>
                <Link href="/enterprise" className="font-medium text-muted hover:text-foreground">
                  Enterprise
                </Link>
              </div>
            </div>
          </section>
        </MarketingQuantumShell>
      </main>
      <Footer />
    </>
  );
}
