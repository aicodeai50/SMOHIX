import type { Metadata } from "next";
import Link from "next/link";

import { ProductFilm } from "@/components/docs/ProductFilm";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "How it works — film",
  description: `Auto-playing story of how ${SITE_BRAND_NAME} pairs incidents, guardrails, approvals, and audit.`,
};

export default function DocsFilmPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Built-in demo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            How {SITE_BRAND_NAME} works
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            This page provides an auto-playing walkthrough of core product workflows for stakeholder
            review.
          </p>

          <div className="mt-10">
            <ProductFilm />
          </div>

          <p className="mt-10 text-sm text-muted">
            <Link href="/docs" className="font-medium text-accent hover:underline">
              ← Learn hub
            </Link>
            {" · "}
            <Link href="/docs/demo" className="font-medium text-accent hover:underline">
              Interactive walkthrough
            </Link>
            {" · "}
            <Link href="/#how-it-works" className="font-medium text-accent hover:underline">
              Marketing storyboard
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
