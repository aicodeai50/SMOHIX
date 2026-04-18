import Link from "next/link";
import {
  SITE_EMAIL_CONTACT,
  SITE_EMAIL_SUPPORT,
  getGeneralMailtoHref,
  getSupportMailtoHref,
} from "@/lib/billing";
import { Logo } from "./Logo";

const legal = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/refund", label: "Refunds & billing" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted">
            AI operations for IT teams — copilot, safe automation, and audit-ready
            controls.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/auth/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="font-medium text-accent hover:underline hover:underline-offset-2"
            >
              Get started
            </Link>
            <Link href="/copilot" className="hover:text-foreground">
              Console
            </Link>
            <Link href="/#modules" className="hover:text-foreground">
              Modules
            </Link>
            <Link href="/#trust" className="hover:text-foreground">
              Security
            </Link>
            <span className="hidden h-4 w-px bg-border sm:inline" aria-hidden />
            <a
              href={getGeneralMailtoHref()}
              className="font-mono text-xs text-foreground/90 hover:text-accent"
              title="Contact"
            >
              {SITE_EMAIL_CONTACT}
            </a>
            <span className="text-muted/40" aria-hidden>
              ·
            </span>
            <a
              href={getSupportMailtoHref()}
              className="font-mono text-xs text-foreground/90 hover:text-accent"
              title="Support"
            >
              {SITE_EMAIL_SUPPORT}
            </a>
          </div>
          <nav
            className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted"
            aria-label="Legal"
          >
            {legal.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted/60">
            All rights reserved. © {year} Shynvo
          </p>
        </div>
      </div>
    </footer>
  );
}
