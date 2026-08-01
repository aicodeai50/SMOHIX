"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Logo } from "@/components/site/Logo";
import { MarketingMobileNav } from "@/components/site/MarketingMobileNav";
import { Button } from "@/components/ui/Button";
import { mFocusRing } from "@/lib/marketing-layout";
import { HEADER_NAV } from "@/lib/site-nav";

export function Navbar({
  userEmail,
  ctaHref = "/auth/sign-in?next=/hub",
  ctaLabel = "Get started",
}: {
  userEmail?: string | null;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-foreground no-underline">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {HEADER_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                } ${mFocusRing}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <MarketingMobileNav />
          <Link
            href="/pilot"
            className="hidden text-[13px] font-medium text-muted hover:text-foreground md:inline"
          >
            Pilot
          </Link>
          {userEmail ? (
            <Link
              href="/hub"
              className="hidden text-[13px] font-medium text-muted hover:text-foreground sm:inline"
            >
              Console
            </Link>
          ) : (
            <Link
              href="/auth/sign-in"
              className="hidden text-[13px] font-medium text-muted hover:text-foreground sm:inline"
            >
              Sign in
            </Link>
          )}
          <Link href={ctaHref} className="hidden sm:inline-flex">
            <Button size="sm">{ctaLabel}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SidebarNav({
  items,
  footer,
}: {
  items: readonly { href: string; label: string; icon?: ReactNode }[];
  footer?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Sidebar">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-white/[0.04] hover:text-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
      {footer ? <div className="mt-auto border-t border-white/[0.06] pt-3">{footer}</div> : null}
    </nav>
  );
}
