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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-foreground no-underline">
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
        <div className="flex items-center gap-3">
          <Link
            href="/copilot"
            className="hidden text-sm text-muted transition-colors hover:text-foreground md:inline"
          >
            Console
          </Link>
          <a
            href="#connect"
            className="hidden rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground sm:inline-flex"
          >
            Connect backends
          </a>
          <a
            href={trialHref}
            className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background shadow-[0_0_0_1px_rgba(56,189,248,0.2)] transition-opacity hover:opacity-90"
          >
            Start trial
          </a>
        </div>
      </div>
    </header>
  );
}
