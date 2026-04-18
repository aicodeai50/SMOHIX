import Link from "next/link";
import { marketingCta } from "@/lib/marketing-copy";
import { Logo } from "./Logo";

const nav = [
  { href: "#modules", label: "Modules" },
  { href: "#operations", label: "Operations" },
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
        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3 md:flex-nowrap">
          <Link
            href="/auth/sign-in"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="inline-flex rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-background shadow-[0_0_20px_-8px_rgba(94,225,255,0.4)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_28px_-6px_rgba(94,225,255,0.5)] sm:px-4"
          >
            {marketingCta.headerPrimary}
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
