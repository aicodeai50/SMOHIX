import type { ReactNode } from "react";
import Link from "next/link";

import { SITE_EMAIL_CONTACT, getMailtoHref } from "@/lib/billing";
import { COMPANY_NAME } from "@/lib/company-identity";
import { mBody, mContainer, mFooterLabel } from "@/lib/marketing-layout";
import {
  FOOTER_COMPANY,
  FOOTER_DEVELOPERS,
  FOOTER_EXPERIENCE,
  FOOTER_LEGAL,
  FOOTER_PRODUCTS,
  FOOTER_SOLUTIONS,
  FOOTER_SUPPORT,
} from "@/lib/site-nav";
import { SITE_COMPANY_NAME, SITE_PRIMARY_DOMAIN } from "@/lib/site-brand";
import { Logo } from "./Logo";

function FooterHeading({ children }: { children: ReactNode }) {
  return <p className={mFooterLabel}>{children}</p>;
}

function FooterLink({
  href,
  label,
  external,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className = "w-fit text-sm text-muted transition-colors hover:text-foreground md:ml-auto";
  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
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
              {SITE_COMPANY_NAME} builds AI products, developer platforms, APIs, and enterprise
              solutions — the official headquarters of the Smohix ecosystem at {SITE_PRIMARY_DOMAIN}.
            </p>
            <p className="text-xs text-muted">
              {COMPANY_NAME} <span aria-hidden>·</span> {SITE_PRIMARY_DOMAIN}
            </p>
          </div>

          <div className="grid flex-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 lg:gap-8 md:text-right">
            <div className="space-y-3">
              <FooterHeading>Experience</FooterHeading>
              <nav className="flex flex-col gap-2" aria-label="Experience">
                {FOOTER_EXPERIENCE.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Products</FooterHeading>
              <nav className="flex flex-col gap-2" aria-label="Products">
                {FOOTER_PRODUCTS.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Solutions</FooterHeading>
              <nav className="flex flex-col gap-2" aria-label="Solutions">
                {FOOTER_SOLUTIONS.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Developers</FooterHeading>
              <nav className="flex flex-col gap-2" aria-label="Developers">
                {FOOTER_DEVELOPERS.map((item) => (
                  <FooterLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    external={"external" in item ? item.external : false}
                  />
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Company</FooterHeading>
              <nav className="flex flex-col gap-2" aria-label="Company">
                {FOOTER_COMPANY.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Support</FooterHeading>
              <nav className="flex flex-col gap-2" aria-label="Support">
                {FOOTER_SUPPORT.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
                <a
                  href={getMailtoHref()}
                  className="w-fit font-mono text-[13px] text-foreground/90 underline-offset-2 hover:text-accent hover:underline md:ml-auto"
                >
                  {SITE_EMAIL_CONTACT}
                </a>
              </nav>
            </div>

            <div className="space-y-3">
              <FooterHeading>Legal</FooterHeading>
              <nav className="flex flex-col gap-2" aria-label="Legal">
                {FOOTER_LEGAL.map((item) => (
                  <FooterLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted/60">
            © {year} {SITE_COMPANY_NAME}. All rights reserved.
          </p>
          <Link href="/" className="text-xs text-muted hover:text-foreground">
            Back to home
          </Link>
        </div>
      </div>
    </footer>
  );
}
