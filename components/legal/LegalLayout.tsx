import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

const legalProseClass =
  "mt-10 space-y-4 text-sm leading-relaxed text-muted " +
  "[&_strong]:font-medium [&_strong]:text-foreground " +
  "[&_h2]:mt-14 [&_h2]:scroll-mt-24 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 [&_h2]:pt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:first:mt-8 " +
  "[&_h3]:mt-8 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 " +
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 " +
  "[&_li]:marker:text-muted/60 " +
  "[&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline " +
  "[&_hr]:my-12 [&_hr]:border-border " +
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_th]:border [&_th]:border-border [&_th]:bg-surface [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-semibold [&_th]:text-foreground [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs " +
  "[&_code]:rounded [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs " +
  "[&_.legal-callout]:my-6 [&_.legal-callout]:rounded-lg [&_.legal-callout]:border [&_.legal-callout]:border-amber-500/20 [&_.legal-callout]:bg-amber-500/5 [&_.legal-callout]:p-4 [&_.legal-callout]:text-sm [&_.legal-callout]:text-foreground/90";

export function LegalLayout({
  title,
  lastUpdated = "April 2026",
  children,
}: {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 px-4 py-14 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="text-xs text-muted transition-colors hover:text-accent"
          >
            ← Back to home
          </Link>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
            Legal · Last updated {lastUpdated}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <div className={legalProseClass}>{children}</div>
        </article>
      </main>
      <Footer />
    </>
  );
}
