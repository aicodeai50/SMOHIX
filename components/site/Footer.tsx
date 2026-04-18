import type { ReactNode } from "react";
import Link from "next/link";
import {
  SITE_EMAIL_CONTACT,
  SITE_EMAIL_SUPPORT,
  getGeneralMailtoHref,
  getSupportMailtoHref,
} from "@/lib/billing";
import { getPublicDeployRef } from "@/lib/build-stamp";
import { marketingCta } from "@/lib/marketing-copy";
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
  const deployRef = getPublicDeployRef();
  return (
    <footer className="border-t border-white/[0.06] bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm leading-relaxed text-muted">
              AI operations for IT teams — copilot, guarded automation, and defensible
              controls.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10 md:text-right">
            <div className="space-y-3">
              <FooterHeading>Explore</FooterHeading>
              <nav className="flex flex-col gap-2 text-sm text-muted" aria-label="Site">
                <Link href="/" className="w-fit hover:text-foreground md:ml-auto">
                  Home
                </Link>
                <Link href="/hub" className="w-fit hover:text-foreground md:ml-auto">
                  Console
                </Link>
                <Link href="/#modules" className="w-fit hover:text-foreground md:ml-auto">
                  Modules
                </Link>
                <Link href="/#trust" className="w-fit hover:text-foreground md:ml-auto">
                  Security
                </Link>
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Account</FooterHeading>
              <nav className="flex flex-col gap-2 text-sm" aria-label="Account">
                <Link
                  href="/auth/sign-in"
                  className="w-fit text-muted hover:text-foreground md:ml-auto"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="w-fit font-medium text-accent hover:underline hover:underline-offset-2 md:ml-auto"
                >
                  {marketingCta.footerSignup}
                </Link>
              </nav>
            </div>

            <div className="space-y-3 sm:col-span-2 md:col-span-1">
              <FooterHeading>Contact</FooterHeading>
              <ul className="space-y-2 text-sm">
                <li className="md:text-right">
                  <span className="block text-xs text-muted">General inquiries</span>
                  <a
                    href={getGeneralMailtoHref()}
                    className="font-mono text-[13px] text-foreground/90 underline-offset-2 hover:text-accent hover:underline"
                  >
                    {SITE_EMAIL_CONTACT}
                  </a>
                </li>
                <li className="md:text-right">
                  <span className="block text-xs text-muted">Product &amp; billing support</span>
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
            All rights reserved. © {year} Shynvo
            {deployRef ? (
              <>
                {" "}
                <span className="text-muted/50" aria-hidden>
                  ·
                </span>{" "}
                <span className="font-mono text-muted/80" title="Git commit on this deploy">
                  {deployRef}
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
