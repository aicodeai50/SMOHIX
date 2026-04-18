import Link from "next/link";
import { getTrialHref } from "@/lib/billing";
import { Logo } from "./Logo";

const nav = [
  { href: "#modules", label: "Modules" },
  { href: "#operations", label: "Operations" },
  { href: "#trust", label: "Trust" },
  { href: "#connect", label: "Connect" },
];

export function Header() {
  const trialHref = getTrialHref();
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
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
            className="inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-medium text-background shadow-[0_0_0_1px_rgba(56,189,248,0.2)] transition-opacity hover:opacity-90 sm:px-4"
          >
            Get started
          </Link>
          <Link
            href="/copilot"
            className="hidden text-sm text-muted transition-colors hover:text-foreground md:inline"
          >
            Console
          </Link>
          <a
            href="#connect"
            className="hidden rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground lg:inline-flex"
          >
            Connect services
          </a>
          <a
            href={trialHref}
            className="hidden rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground xl:inline-flex"
          >
            Start trial
          </a>
        </div>
      </div>
    </header>
  );
}
