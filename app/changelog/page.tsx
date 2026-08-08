import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CHANGELOG_CATEGORY_LABELS,
  CHANGELOG_CHANGE_LABELS,
  CHANGELOG_ENTRIES,
} from "@/lib/changelog-data";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mArticle, mBody, mCard, mH1, mH2 } from "@/lib/marketing-layout";
import { SITE_PUBLIC_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Changelog",
  description: `Product progress across the ${SITE_PUBLIC_BRAND} ecosystem — categorized, honest release notes.`,
  path: "/changelog",
});

export default function ChangelogPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className={mArticle}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">
            {SITE_PUBLIC_BRAND}
          </p>
          <h1 className={`mt-2 ${mH1}`}>Changelog</h1>
          <p className={`mt-4 ${mBody}`}>
            High-level shipped work — not every commit. Structured for future GitHub
            releases integration. For source history, use the{" "}
            <a
              href="https://github.com/aicodeai50/SMOHIX"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>
            .
          </p>
          <ol className="mt-10 space-y-6">
            {CHANGELOG_ENTRIES.map((entry) => (
              <li key={entry.title} className={mCard}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent/90">
                    {entry.date}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full border border-white/[0.1] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted"
                      >
                        {CHANGELOG_CATEGORY_LABELS[cat]}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.changeTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full border border-accent/20 bg-accent-dim/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent"
                      >
                        {CHANGELOG_CHANGE_LABELS[type]}
                      </span>
                    ))}
                  </div>
                </div>
                <h2 className={`mt-3 ${mH2}`}>{entry.title}</h2>
                <ul className={`mt-4 list-inside list-disc space-y-2 ${mBody}`}>
                  {entry.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className={`mt-14 ${mBody}`}>
            <Link href="/pilot" className="font-medium text-accent hover:underline">
              Join a pilot →
            </Link>
            {" · "}
            <Link href="/" className="font-medium text-accent hover:underline">
              ← Home
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
