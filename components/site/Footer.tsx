import type { ReactNode } from "react";
import Link from "next/link";
import {
  SITE_EMAIL_CONTACT,
  SITE_EMAIL_SUPPORT,
  getGeneralMailtoHref,
  getSupportMailtoHref,
} from "@/lib/billing";
import { SITE_BRAND_NAME } from "@/lib/site-brand";
import { Logo } from "./Logo";

const legal = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/refund", label: "Refunds & billing" },
] as const;

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{children}</p>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-[0.9375rem] leading-relaxed text-muted">
              Safe automation for IT operations — incident response with approvals, dry-runs, and
              proof in one console.
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
                <Link href="/status" className="w-fit hover:text-foreground md:ml-auto">
                  Status
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
                <Link href="/auth/sign-in" className="w-fit hover:text-foreground md:ml-auto">
                  Account
                </Link>
                <a
                  href={getGeneralMailtoHref()}
                  className="w-fit hover:text-foreground md:ml-auto"
                >
                  Contact
                </a>
              </nav>
              <ul className="mt-3 space-y-2 text-sm md:text-right">
                <li>
                  <span className="block text-xs text-muted">General</span>
                  <a
                    href={getGeneralMailtoHref()}
                    className="font-mono text-[13px] text-foreground/90 underline-offset-2 hover:text-accent hover:underline"
                  >
                    {SITE_EMAIL_CONTACT}
                  </a>
                </li>
                <li>
                  <span className="block text-xs text-muted">Support</span>
                  <a
                    href={getSupportMailtoHref()}
                    className="font-mono text-[13px] text-foreground/90 underline-offset-2 hover:text-accent hover:underline"
                  >
                    {SITE_EMAIL_SUPPORT}
                  </a>
                </li>
              </ul>
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
