import Link from "next/link";

import { Logo } from "./Logo";
import { MarketingMobileNav } from "./MarketingMobileNav";
import { MarketingNavRail } from "./MarketingNavRail";
import { MarketingNavRailCompact } from "./MarketingNavRailCompact";
import { SiteHeaderActions } from "./SiteHeaderActions";

export function Header() {
  return (
    <header className="smohix-header-living sticky top-0 z-50 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] min-w-0 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link
          href="/"
          aria-label="Smohix home"
          className="min-w-0 shrink-0 text-foreground no-underline"
        >
          <Logo decorative />
        </Link>

        <div className="hidden min-w-0 flex-1 md:block lg:hidden">
          <MarketingNavRailCompact />
        </div>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <MarketingNavRail />
        </div>

        <div className="ml-auto flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
          <MarketingMobileNav />
          <SiteHeaderActions />
        </div>
      </div>
    </header>
  );
}
