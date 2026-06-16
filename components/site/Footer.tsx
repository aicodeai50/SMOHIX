import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_EMAIL_CONTACT, getMailtoHref } from "@/lib/billing";
import { mBody, mContainer, mFooterLabel } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME, SITE_PRIMARY_DOMAIN } from "@/lib/site-brand";
import { Logo } from "./Logo";

const legal = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/security", label: "Security & trust" },
  { href: "/refund", label: "Refunds & billing" },
] as const;

function FooterHeading({ children }: { children: ReactNode }) {
  return <p className={mFooterLabel}>{children}</p>;
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] bg-surface/40">
      <div className={`${mContainer} py-12`}>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className={mBody}>
              {SITE_BRAND_NAME} is the enterprise command platform for incident response,
              cybersecurity operations, and compliance evidence — built for platform, SOC, SRE, and
              GRC teams.
            </p>
            <p className="text-xs text-muted">
              Product: {SITE_BRAND_NAME} <span aria-hidden>·</span> Domain: {SITE_PRIMARY_DOMAIN}
            </p>
          </div>

          <div className="grid flex-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10 md:text-right">
            <div className="space-y-3">
              <FooterHeading>Product</FooterHeading>
              <nav className="flex flex-col gap-2 text-sm text-muted" aria-label="Product">
                <Link href="/hub" className="w-fit hover:text-foreground md:ml-auto">
                  Console
                </Link>
                <Link href="/#modules" className="w-fit hover:text-foreground md:ml-auto">
                  Modules
                </Link>
                <Link href="/pricing" className="w-fit hover:text-foreground md:ml-auto">
                  Pricing
                </Link>
                <Link href="/cybersecurity" className="w-fit hover:text-foreground md:ml-auto">
                  Cybersecurity
                </Link>
                <Link href="/enterprise" className="w-fit hover:text-foreground md:ml-auto">
                  Enterprise
                </Link>
                <Link href="/integrations" className="w-fit hover:text-foreground md:ml-auto">
                  Integrations
                </Link>
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Platform</FooterHeading>
              <nav className="flex flex-col gap-2 text-sm text-muted" aria-label="Platform">
                <Link href="/platform" className="w-fit hover:text-foreground md:ml-auto">
                  Platform overview
                </Link>
                <Link href="/trust" className="w-fit hover:text-foreground md:ml-auto">
                  Trust &amp; governance
                </Link>
                <Link href="/security" className="w-fit hover:text-foreground md:ml-auto">
                  Security
                </Link>
                <Link href="/status" className="w-fit hover:text-foreground md:ml-auto">
                  Status
                </Link>
                <Link href="/next" className="w-fit hover:text-foreground md:ml-auto">
                  What&apos;s next
                </Link>
                <Link href="/changelog" className="w-fit hover:text-foreground md:ml-auto">
                  Changelog
                </Link>
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Resources</FooterHeading>
              <nav className="flex flex-col gap-2 text-sm text-muted" aria-label="Resources">
                <Link href="/docs" className="w-fit hover:text-foreground md:ml-auto">
                  Docs
                </Link>
                <Link href="/docs/api" className="w-fit hover:text-foreground md:ml-auto">
                  API reference
                </Link>
                <a
                  href="https://github.com/aicodeai50/ZENTRO"
                  className="w-fit hover:text-foreground md:ml-auto"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                <Link href="/why" className="w-fit hover:text-foreground md:ml-auto">
                  Why {SITE_BRAND_NAME}
                </Link>
                <Link href="/" className="w-fit hover:text-foreground md:ml-auto">
                  Home
                </Link>
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Company</FooterHeading>
              <nav className="flex flex-col gap-2 text-sm text-muted" aria-label="Company">
                <Link href="/about" className="w-fit hover:text-foreground md:ml-auto">
                  About
                </Link>
                <Link href="/careers" className="w-fit hover:text-foreground md:ml-auto">
                  Careers
                </Link>
                <Link href="/auth/sign-in" className="w-fit hover:text-foreground md:ml-auto">
                  Account
                </Link>
                <a
                  href={getMailtoHref()}
                  className="w-fit font-mono text-[13px] text-foreground/90 underline-offset-2 hover:text-accent hover:underline md:ml-auto"
                >
                  {SITE_EMAIL_CONTACT}
                </a>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <nav
            className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted"
            aria-label="Legal"
          >
            {legal.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted/60 sm:text-right">
            All rights reserved. © {year} {SITE_BRAND_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
