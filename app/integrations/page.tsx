import type { Metadata } from "next";
import Link from "next/link";

import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SITE_EMAIL_CONTACT, getMailtoHref } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "What Smohix connects to today and what is on the roadmap — monitoring, chat, cloud, and ticketing.",
};

const TODAY = [
  {
    name: "HTTP alert ingest",
    body: "Bearer-token ingest to open or dedupe incidents from your own webhooks and scripts (paid-gated with Supabase).",
    href: "/settings",
    cta: "Settings",
  },
  {
    name: "SIEM & EDR shapes",
    body: "Normalize common alert payloads into Smohix incidents. Vendor-specific OAuth connectors are planned, not implied as live.",
    href: "/docs/api",
    cta: "API docs",
  },
  {
    name: "Reasoning & robot HTTP endpoints",
    body: "Optional internal endpoints for extended reasoning and guarded remediation execution, health-checked from the console.",
    href: "/settings/connectors",
    cta: "Connectors",
  },
  {
    name: "Supabase & billing",
    body: "Accounts, incidents, services, audit append, and Lemon Squeezy sync when you configure keys.",
    href: "/hub",
    cta: "Console",
  },
] as const;

const ROADMAP = [
  { category: "Monitoring", items: ["Datadog", "Prometheus / Grafana Alerting", "New Relic"] },
  { category: "Chat & paging", items: ["Slack", "Microsoft Teams", "PagerDuty (events)"] },
  { category: "Cloud control planes", items: ["AWS", "Azure", "GCP"] },
  { category: "ITSM / tickets", items: ["Jira", "ServiceNow", "Linear (change tasks)"] },
  { category: "Security & exposure", items: ["Splunk (webhook)", "Microsoft Sentinel", "CrowdStrike Falcon", "Qualys / Tenable findings"] },
] as const;

export default function IntegrationsPage() {
  return (
    <>
      <Header />
      <MarketingQuantumShell>
        <main className="flex-1 border-b border-white/[0.06]">
          <div className="smohix-hero-future smohix-quantum-section border-b border-white/[0.06]">
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90 smohix-eyebrow-cyber">
                Integrations
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight smohix-living-headline sm:text-4xl">
                Integrations — today and next
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                Smohix is useful without a wall of logos: you can run incidents, runbooks, and
                guarded automations on day one. Below is what works now versus what we expect to add
                as teams adopt the platform.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 smohix-quantum-section">
            <section aria-labelledby="today-heading">
              <h2
                id="today-heading"
                className="text-lg font-semibold tracking-tight smohix-living-headline sm:text-xl"
              >
                Available today
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Configure these from the console after sign-in. Nothing here sends data to vendors
                until you set URLs and keys.
              </p>
              <ul className="mt-8 grid gap-5 md:grid-cols-3">
                {TODAY.map((item) => (
                  <li
                    key={item.name}
                    className="smohix-bento-cell flex flex-col rounded-2xl p-5"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.body}</p>
                    <Link
                      href={item.href}
                      className="mt-4 text-sm font-medium text-accent hover:underline"
                    >
                      {item.cta} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-16 sm:mt-20" aria-labelledby="roadmap-heading">
              <h2
                id="roadmap-heading"
                className="text-lg font-semibold tracking-tight smohix-living-headline sm:text-xl"
              >
                Roadmap (vendor integrations)
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Names below are targets for first-party connectors or supported webhooks — not live
                product claims. Shipping order follows customer demand and safety review.
              </p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {ROADMAP.map((block) => (
                  <div
                    key={block.category}
                    className="smohix-bento-cell rounded-2xl border-dashed px-5 py-5"
                  >
                    <h3 className="text-sm font-semibold text-foreground">{block.category}</h3>
                    <ul className="mt-3 space-y-2 text-sm text-muted">
                      {block.items.map((name) => (
                        <li key={name} className="flex items-center gap-2">
                          <span
                            className="rounded-full border border-white/[0.12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
                            aria-label="Coming later"
                          >
                            Planned
                          </span>
                          <span className="text-foreground/85">{name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-8 smohix-bento-cell rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-foreground">How users connect vendors</h3>
                <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted">
                  <li>Create an ingest token or configure an internal HTTP endpoint from Settings.</li>
                  <li>Send alert, deploy, or remediation payloads with service and environment context.</li>
                  <li>Use approvals and audit capture so high-impact actions stay reviewable.</li>
                </ol>
              </div>
            </section>

            <p className="mt-14 max-w-2xl text-sm leading-relaxed text-muted">
              Want a vendor prioritized?{" "}
              <a
                href={getMailtoHref()}
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                {SITE_EMAIL_CONTACT}
              </a>{" "}
              with your stack and incident volume — it helps us sequence OAuth scopes, webhook
              shapes, and audit requirements.
            </p>

            <div className="mt-10">
              <Link
                href="/"
                className="text-sm font-medium text-accent hover:underline"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </main>
      </MarketingQuantumShell>
      <Footer />
    </>
  );
}
