import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const metadata: Metadata = {
  title: "Docs",
  description: "Learn hub — platform narrative, integrations roadmap, and console entry points.",
};

const CARDS = [
  {
    title: "Platform overview",
    body: "Summary, end-to-end flow, guarded model, capabilities by bucket, runtime modes, differentiation, architecture.",
    href: "/platform",
  },
  {
    title: "Why Shynvo",
    body: "Short philosophy — accountability over hype, guarded automation as thesis.",
    href: "/why",
  },
  {
    title: "Integrations roadmap",
    body: "What ships today vs planned vendor connectors and categories.",
    href: "/integrations",
  },
  {
    title: "Vision & roadmap (console)",
    body: "Long-horizon direction inside the authenticated app.",
    href: "/auth/sign-in?next=/vision",
  },
  {
    title: "Incidents",
    body: "Create, manage, timeline, postmortem, markdown export when DB-backed.",
    href: "/auth/sign-in?next=/incidents",
  },
  {
    title: "Automations & dry-run",
    body: "Playbooks and simulation API before production calls.",
    href: "/auth/sign-in?next=/automations",
  },
  {
    title: "Connectors & billing",
    body: "Optional HTTP backends, Lemon Squeezy, API keys, alert ingest tokens.",
    href: "/auth/sign-in?next=/settings",
  },
] as const;

export default function DocsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Learn hub
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Open documentation for narrative and entry points. Deep API reference can grow here over
            time; today the highest-signal doc is the{" "}
            <Link href="/platform" className="font-medium text-accent hover:underline">
              platform overview
            </Link>
            .
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => (
              <li key={c.title}>
                <Link
                  href={c.href}
                  className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-accent/30 hover:bg-white/[0.035]"
                >
                  <h2 className="text-base font-semibold text-foreground">{c.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{c.body}</p>
                  <span className="mt-4 text-xs font-semibold text-accent">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-12 text-sm text-muted">
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
