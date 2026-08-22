import Link from "next/link";

import { Logo } from "./Logo";
import { MarketingMobileNav } from "./MarketingMobileNav";
import { MarketingNavRail } from "./MarketingNavRail";
import { SiteHeaderActions } from "./SiteHeaderActions";

export function Header() {
  return (
    <header className="smohix-header-living sticky top-0 z-50 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Smohix home" className="min-w-0 shrink-0 text-foreground no-underline">
          <Logo decorative />
        </Link>

        <MarketingNavRail />

        <div className="flex items-center gap-2">
          <MarketingMobileNav />
          <SiteHeaderActions />
        </div>
      </div>
    </header>
  );
}
