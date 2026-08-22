"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mFocusRing } from "@/lib/marketing-layout";
import { HEADER_NAV } from "@/lib/site-nav";

/** Tablet-only compact architectural rail — desktop uses full rail, mobile uses drawer. */
export function MarketingNavRailCompact() {
  const pathname = usePathname();
  const items = HEADER_NAV.filter((item) =>
    ["/products", "/platform", "/developers", "/pricing", "/pilot"].includes(item.href),
  );

  return (
    <nav
      className="smohix-nav-rail smohix-nav-rail--compact hidden min-w-0 max-w-full md:flex lg:hidden"
      aria-label="Primary"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`smohix-nav-rail__link shrink-0 ${active ? "smohix-nav-rail__link--active" : ""} ${mFocusRing}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
