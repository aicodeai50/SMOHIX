"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/Button";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
] as const;

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

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
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
          <Link href={ctaHref}>
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
