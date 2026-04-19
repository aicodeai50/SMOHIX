import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const metadata: Metadata = {
  title: "Why Shynvo",
  description:
    "Philosophy: guarded automation, structured operations, and evidence-first IT — not hype.",
};

export default function WhyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Why Shynvo
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Operations tools fail when they optimize for speed <em>without</em> accountability. Shynvo
            is built around the opposite bet:{" "}
            <strong className="font-medium text-foreground/90">structured work, explicit checkpoints, and a trail you can show in review</strong>.
            AI assists triage and drafting; it does not silently own production.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            <strong className="text-foreground/90">Guarded automation</strong> is the product thesis — dry-runs and
            approvals before side effects, connector-backed execution only when you wire it, and audit as a
            first-class outcome. We say no to &ldquo;self-healing&rdquo; theater until the safety story is true.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            <strong className="text-foreground/90">Predictable operations</strong> means the same routes and logs
            after a stressful night as on a calm Tuesday — fewer snowflake runbooks living only in someone&apos;s
            head or DMs.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 text-sm font-medium">
            <Link href="/platform" className="text-accent hover:underline">
              Full platform overview →
            </Link>
            <Link href="/" className="text-muted hover:text-accent hover:underline">
              ← Home
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
