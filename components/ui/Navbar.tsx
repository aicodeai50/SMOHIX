"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Logo } from "@/components/site/Logo";
import { MarketingMobileNav } from "@/components/site/MarketingMobileNav";
import { MarketingNavRail } from "@/components/site/MarketingNavRail";
import { SiteHeaderActions } from "@/components/site/SiteHeaderActions";
import { mFocusRing } from "@/lib/marketing-layout";

export function Navbar({
  userEmail,
}: {
  userEmail?: string | null;
}) {
  return (
    <header className="smohix-header-living sticky top-0 z-50 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-foreground no-underline">
          <Logo />
        </Link>

        <MarketingNavRail />

        <div className="flex items-center gap-2">
          <MarketingMobileNav />
          {userEmail ? (
            <Link
              href="/hub"
              className={`hidden text-[13px] font-medium text-muted hover:text-foreground sm:inline ${mFocusRing}`}
            >
              Console
            </Link>
          ) : null}
          <SiteHeaderActions compact />
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
            className={`smohix-rail-node flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium ${
              active
                ? "smohix-rail-node--active smohix-instrument-rail-active text-foreground"
                : "text-muted hover:text-foreground"
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
