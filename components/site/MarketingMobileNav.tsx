"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PRIMARY_NAV } from "@/lib/site-nav";

export function MarketingMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-xs font-semibold text-foreground/90 transition-colors hover:border-accent/35 lg:hidden"
        aria-expanded={open}
        aria-controls="marketing-mobile-nav"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>

      {open ? (
        <div
          id="marketing-mobile-nav"
          className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/[0.08] bg-background/98 backdrop-blur-xl lg:hidden"
          aria-label="Site navigation"
        >
          <nav className="mx-auto grid max-w-6xl gap-1 px-4 py-4 sm:grid-cols-2">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/docs"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Docs
            </Link>
            <Link
              href="/status"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-white/[0.04] hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Status
            </Link>
          </nav>
          <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-white/[0.06] px-4 py-4 sm:flex-row">
            <Link
              href="/auth/sign-in"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.1] px-4 text-sm font-medium text-muted transition-colors hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/hub"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              onClick={() => setOpen(false)}
            >
              Console
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
