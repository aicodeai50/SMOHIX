import Link from "next/link";
import { getGeneralMailtoHref, getSupportMailtoHref } from "@/lib/billing";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted">
            AI operations for IT teams — copilot, safe automation, and audit-ready
            controls.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/copilot" className="hover:text-foreground">
            Console
          </Link>
          <a href="#modules" className="hover:text-foreground">
            Modules
          </a>
          <a href="#trust" className="hover:text-foreground">
            Security
          </a>
          <a href={getGeneralMailtoHref()} className="hover:text-foreground">
            Contact
          </a>
          <a href={getSupportMailtoHref()} className="hover:text-foreground">
            Support
          </a>
          <span className="text-muted/60">© {new Date().getFullYear()} Shynvo</span>
        </div>
      </div>
    </footer>
  );
}
