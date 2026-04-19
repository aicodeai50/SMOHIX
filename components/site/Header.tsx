import Link from "next/link";

import { Logo } from "./Logo";
import { MarketingHistoryNav } from "./MarketingHistoryNav";

const nav = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#modules", label: "Modules" },
  { href: "#operations", label: "Operations" },
  { href: "#proof", label: "Proof" },
  { href: "#trust", label: "Trust" },
  { href: "#connect", label: "Connect" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 md:h-16 md:flex-nowrap md:py-0">
        <Link href="/" className="min-w-0 shrink-0 text-foreground no-underline">
          <Logo />
        </Link>
        <nav className="hidden flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-muted md:flex lg:gap-x-6">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Link href="/integrations" className="transition-colors hover:text-foreground">
            Integrations
          </Link>
        </nav>
        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3 md:flex-nowrap">
          <MarketingHistoryNav />
          <Link
            href="/auth/sign-in"
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Account
          </Link>
          <Link
            href="/hub"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-accent md:inline"
          >
            Console
          </Link>
        </div>
      </div>
    </header>
  );
}
