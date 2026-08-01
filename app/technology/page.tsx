import type { Metadata } from "next";
import Link from "next/link";

import { MaturityBadge } from "@/components/marketing/MaturityBadge";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { EcosystemConnectionMap } from "@/components/technology/EcosystemConnectionMap";
import { ExecutiveFlowDiagram } from "@/components/technology/ExecutiveFlowDiagram";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import {
  mBody,
  mCard,
  mCardMotion,
  mCardTitle,
  mContainer,
  mEyebrow,
  mFocusRing,
  mH2,
  mH3,
  mLede,
  mProductGrid,
  mSection,
  mStaggerGrid,
} from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";
import {
  BUILT_FOR_GROWTH,
  CORE_PLATFORM_CARDS,
  DEVELOPER_ECOSYSTEM_LINKS,
  ECOSYSTEM_CONNECTION_FLOW,
  ENGINEERING_PRINCIPLES,
  GROWTH_PHASE_STYLES,
  PLATFORM_ARCHITECTURE_FLOW,
  SECURITY_PILLARS,
  TECHNOLOGY_STACK_CATEGORIES,
} from "@/lib/technology-content";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Technology",
  description: `${SITE_COMPANY_NAME} is built as a scalable AI platform for secure organizations, developers, and intelligent products — architecture, principles, and growth without exposing implementation secrets.`,
  path: "/technology",
});

export default function TechnologyPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="zentro-hero-future border-b border-white/[0.06] py-16 sm:py-20">
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Technology</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Built for secure organizations, intelligent products, and long-term scale
            </h1>
            <p className={`mt-5 max-w-2xl text-base sm:text-lg ${mBody}`}>
              {SITE_COMPANY_NAME} is engineered as a scalable AI platform — designed for developers,
              enterprise buyers, healthcare and government teams, and anyone who needs confidence
              without compromising privacy or control.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/architecture"
                className={`inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90 ${mFocusRing}`}
              >
                View architecture
              </Link>
              <Link
                href="/developers"
                className={`inline-flex h-10 items-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40 ${mFocusRing}`}
              >
                Developer hub
              </Link>
            </div>
          </div>
        </section>

        {/* Section 1 — Platform Architecture */}
        <MarketingReveal
          className={`${mSection} bg-white/[0.01]`}
          aria-labelledby="platform-architecture-heading"
        >
          <div className={mContainer}>
            <p className={`${mEyebrow} text-accent/90`}>Architecture</p>
            <h2 id="platform-architecture-heading" className={`mt-2 ${mH2}`}>
              Platform architecture
            </h2>
            <p className={`${mLede} mt-3 max-w-2xl`}>
              A layered model from people to organizations — every step is a product capability,
              not an internal microservice name.
            </p>
            <div className="mt-12">
              <ExecutiveFlowDiagram
                steps={PLATFORM_ARCHITECTURE_FLOW}
                ariaLabel="Platform architecture flow from users to organizations"
                headingId="platform-architecture-heading"
              />
            </div>
          </div>
        </MarketingReveal>

        {/* Section 2 — Core Platform */}
        <MarketingReveal className={mSection} aria-labelledby="core-platform-heading">
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Capabilities</p>
            <h2 id="core-platform-heading" className={`mt-2 ${mH2}`}>
              Core platform
            </h2>
            <p className={`${mLede} mt-3 max-w-2xl`}>
              Six pillars that compose the Zentro ecosystem — each with honest maturity on its
              product page.
            </p>
            <div className={`mt-10 ${mProductGrid} ${mStaggerGrid}`}>
              {CORE_PLATFORM_CARDS.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`group flex flex-col rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-6 ${mCardMotion} hover:border-accent/30 hover:shadow-[0_0_36px_-14px_rgba(94,225,255,0.22)] ${mFocusRing}`}
                >
                  <h3 className={`${mH3} text-base transition-colors group-hover:text-accent`}>
                    {card.title}
                  </h3>
                  <p className={`mt-3 flex-1 ${mBody}`}>{card.description}</p>
                  <span className="mt-4 text-sm font-medium text-accent">Learn more →</span>
                </Link>
              ))}
            </div>
          </div>
        </MarketingReveal>

        {/* Section 3 — Technology Stack */}
        <MarketingReveal
          className={`${mSection} border-t border-white/[0.06] bg-white/[0.01]`}
          aria-labelledby="tech-stack-heading"
        >
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Stack</p>
            <h2 id="tech-stack-heading" className={`mt-2 ${mH2}`}>
              Technology stack
            </h2>
            <p className={`${mLede} mt-3 max-w-2xl`}>
              Categories and technologies we build with — implementation details live in developer
              documentation, not on this page.
            </p>
            <div className={`mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${mStaggerGrid}`}>
              {TECHNOLOGY_STACK_CATEGORIES.map((block) => (
                <article
                  key={block.category}
                  className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 ${mCardMotion} hover:border-white/[0.14]`}
                >
                  <h3 className={mH3}>{block.category}</h3>
                  <ul className={`mt-4 space-y-2 ${mBody}`}>
                    {block.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-accent" aria-hidden>
                          ·
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </MarketingReveal>

        {/* Section 4 — Engineering Principles */}
        <MarketingReveal className={mSection} aria-labelledby="principles-heading">
          <div className={mContainer}>
            <p className={`${mEyebrow} text-accent/90`}>Principles</p>
            <h2 id="principles-heading" className={`mt-2 ${mH2}`}>
              Engineering principles
            </h2>
            <p className={`${mLede} mt-3 max-w-2xl`}>
              How we make architectural decisions — transparency for customers, investors, and future
              teammates.
            </p>
            <div className={`mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${mStaggerGrid}`}>
              {ENGINEERING_PRINCIPLES.map((principle) => (
                <article
                  key={principle.title}
                  className="zentro-holo-panel rounded-2xl p-5 transition-[border-color] duration-300 hover:border-accent/25"
                >
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {principle.title}
                  </h3>
                  <p className={`mt-2 text-xs leading-relaxed ${mBody}`}>{principle.description}</p>
                </article>
              ))}
            </div>
          </div>
        </MarketingReveal>

        {/* Section 5 — How Everything Connects */}
        <MarketingReveal
          className={`${mSection} border-t border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent`}
          aria-labelledby="ecosystem-connect-heading"
        >
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Ecosystem</p>
            <h2 id="ecosystem-connect-heading" className={`mt-2 ${mH2}`}>
              How everything connects
            </h2>
            <p className={`${mLede} mt-3 max-w-2xl`}>
              One coherent platform — from public home to enterprise products. Hover or focus each
              node to explore.
            </p>
            <div className="mt-12">
              <EcosystemConnectionMap
                nodes={ECOSYSTEM_CONNECTION_FLOW}
                headingId="ecosystem-connect-heading"
              />
            </div>
          </div>
        </MarketingReveal>

        {/* Section 6 — Built For Growth */}
        <MarketingReveal className={mSection} aria-labelledby="growth-heading">
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Roadmap</p>
            <h2 id="growth-heading" className={`mt-2 ${mH2}`}>
              Built for growth
            </h2>
            <p className={`${mLede} mt-3 max-w-2xl`}>
              Honest maturity labels — we distinguish what ships today from what is preview,
              prototype, or on the horizon.
            </p>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {BUILT_FOR_GROWTH.map((phase) => (
                <article
                  key={phase.phase}
                  className={`rounded-2xl border p-6 ${GROWTH_PHASE_STYLES[phase.phase]}`}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    {phase.label}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {phase.items.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center justify-between gap-3 text-sm text-muted"
                      >
                        <span className="font-medium text-foreground/90">{item.label}</span>
                        <MaturityBadge maturity={item.maturity} />
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </MarketingReveal>

        {/* Section 7 — Security */}
        <MarketingReveal
          className={`${mSection} border-t border-white/[0.06] bg-white/[0.01]`}
          aria-labelledby="security-heading"
        >
          <div className={mContainer}>
            <p className={`${mEyebrow} text-accent/90`}>Security</p>
            <h2 id="security-heading" className={`mt-2 ${mH2}`}>
              Security & trust
            </h2>
            <p className={`${mLede} mt-3 max-w-2xl`}>
              Compliance-ready architecture — we do not claim certifications or attestations we have
              not published. See the{" "}
              <Link href="/trust" className="text-accent underline-offset-2 hover:underline">
                trust center
              </Link>{" "}
              for current maturity.
            </p>
            <div className={`mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${mStaggerGrid}`}>
              {SECURITY_PILLARS.map((pillar) => (
                <article key={pillar.title} className={mCard}>
                  <h3 className={mCardTitle}>{pillar.title}</h3>
                  <p className={`mt-2 ${mBody}`}>{pillar.description}</p>
                </article>
              ))}
            </div>
          </div>
        </MarketingReveal>

        {/* Section 8 — Developer Ecosystem */}
        <MarketingReveal className={`${mSection} pb-20`} aria-labelledby="developers-heading">
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Developers</p>
            <h2 id="developers-heading" className={`mt-2 ${mH2}`}>
              Developer ecosystem
            </h2>
            <p className={`${mLede} mt-3 max-w-2xl`}>
              Implementation details, API references, and integration guides belong in developer
              documentation — linked here for a natural path from overview to build.
            </p>
            <nav
              className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Developer resources"
            >
              {DEVELOPER_ECOSYSTEM_LINKS.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className={`group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 ${mCardMotion} hover:border-accent/35 ${mFocusRing}`}
                >
                  <span className="text-base font-semibold text-foreground transition-colors group-hover:text-accent">
                    {link.label}
                  </span>
                  <span className={`mt-2 ${mBody}`}>{link.description}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-12 flex flex-wrap gap-3 border-t border-white/[0.06] pt-10">
              <Link
                href="/architecture"
                className={`rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40 ${mFocusRing}`}
              >
                System architecture →
              </Link>
              <Link
                href="/security"
                className={`rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40 ${mFocusRing}`}
              >
                Security →
              </Link>
              <Link
                href="/enterprise"
                className={`rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40 ${mFocusRing}`}
              >
                Enterprise →
              </Link>
            </div>
          </div>
        </MarketingReveal>
      </main>
      <Footer />
    </>
  );
}
