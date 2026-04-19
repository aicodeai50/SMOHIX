import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mArticle, mBody, mH1, mH2 } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: `Why ${SITE_BRAND_NAME}`,
  description:
    "Controlled operations: why guardrails, dry-runs, approvals, and audit matter — and how this product is intentionally different.",
};

export default function WhyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <article className={mArticle}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">Philosophy</p>
          <h1 className={`mt-2 ${mH1}`}>Why {SITE_BRAND_NAME}</h1>
          <p className={`mt-4 ${mBody}`}>
            Most outages are not mysteries — they are coordination failures. Teams already have monitoring, chat, and
            scripts. What they often lack is a <strong className="font-medium text-foreground/90">single place</strong>{" "}
            where work is structured, change is gated, and evidence survives the night.
          </p>

          <section className="mt-12 space-y-3" aria-labelledby="controlled-heading">
            <h2 id="controlled-heading" className={mH2}>
              Controlled operations, not autonomous theater
            </h2>
            <p className={mBody}>
              {SITE_BRAND_NAME} treats assistance as a multiplier for responders, not a replacement for accountability.
              Copilot can draft and suggest; it does not silently own production. The product thesis is simple:{" "}
              <strong className="font-medium text-foreground/90">humans stay in the loop where it matters</strong>, and
              the console makes that loop visible.
            </p>
          </section>

          <section className="mt-10 space-y-3" aria-labelledby="guardrails-heading">
            <h2 id="guardrails-heading" className={mH2}>
              Why guardrails and dry-runs matter
            </h2>
            <p className={mBody}>
              Automation without simulation is optimism. Dry-runs exist so the team agrees on intent and blast radius
              before a connector touches production. Guardrails turn “someone ran a script” into “someone ran a
              recorded path with checkpoints.”
            </p>
          </section>

          <section className="mt-10 space-y-3" aria-labelledby="approvals-heading">
            <h2 id="approvals-heading" className={mH2}>
              Why approvals matter
            </h2>
            <p className={mBody}>
              Approvals are not bureaucracy for its own sake — they are how organizations encode judgment under
              stress. A queue with a clear state machine beats a thread that scrolls away. {SITE_BRAND_NAME} records
              decisions where reviewers already work: in the console, next to the automation that will execute.
            </p>
          </section>

          <section className="mt-10 space-y-3" aria-labelledby="audit-heading">
            <h2 id="audit-heading" className={mH2}>
              Why audit matters
            </h2>
            <p className={mBody}>
              Post-incident review is not optional for mature teams. An append-oriented activity log gives you a
              defensible story: who approved what, when status changed, and how automation participated. Export paths
              grow with your plan — the goal is evidence you can show without rebuilding it from memory.
            </p>
          </section>

          <section className="mt-10 space-y-3" aria-labelledby="different-heading">
            <h2 id="different-heading" className={mH2}>
              Why {SITE_BRAND_NAME} is different
            </h2>
            <p className={mBody}>
              Paging vendors optimize for getting humans awake. ITSM suites optimize for process breadth.{" "}
              {SITE_BRAND_NAME} optimizes for the narrow wedge between signal and production change:{" "}
              <strong className="font-medium text-foreground/90">
                incidents, guarded automations, and audit in one surface
              </strong>
              . It is opinionated on purpose — fewer tabs, fewer handoffs, one narrative for responders and reviewers.
            </p>
          </section>

          <div className="mt-12 flex flex-wrap gap-4 text-sm font-medium">
            <Link href="/trust" className="text-accent hover:underline">
              Trust &amp; governance →
            </Link>
            <Link href="/platform" className="text-accent hover:underline">
              Platform overview →
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
