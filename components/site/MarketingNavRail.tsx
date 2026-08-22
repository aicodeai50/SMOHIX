"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mFocusRing } from "@/lib/marketing-layout";
import { HEADER_NAV } from "@/lib/site-nav";

export function MarketingNavRail() {
  const pathname = usePathname();

  return (
    <nav className="smohix-nav-rail hidden lg:flex" aria-label="Primary">
      {HEADER_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`smohix-nav-rail__link ${active ? "smohix-nav-rail__link--active" : ""} ${mFocusRing}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
