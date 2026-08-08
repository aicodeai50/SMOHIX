import Link from "next/link";

import { Logo } from "./Logo";
import { MarketingMobileNav } from "./MarketingMobileNav";
import { SiteHeaderActions } from "./SiteHeaderActions";
import { mFocusRing } from "@/lib/marketing-layout";
import { HEADER_NAV } from "@/lib/site-nav";

export function Header() {
  return (
    <header className="smohix-header-living sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="min-w-0 shrink-0 text-foreground no-underline">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {HEADER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:text-foreground ${mFocusRing}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <MarketingMobileNav />
          <SiteHeaderActions />
        </div>
      </div>
    </header>
  );
}
