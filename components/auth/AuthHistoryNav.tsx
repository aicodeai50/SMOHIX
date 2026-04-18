"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const btn =
  "inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface/60 px-2.5 text-xs font-semibold text-foreground/90 transition-colors hover:border-accent/35 hover:bg-surface-elevated/60 hover:text-accent";

export function AuthHistoryNav() {
  const router = useRouter();
  return (
    <nav
      className="flex flex-wrap items-center justify-end gap-2"
      aria-label="History and exit"
    >
      <button type="button" className={btn} onClick={() => router.back()} aria-label="Go back">
        <span aria-hidden>←</span> Back
      </button>
      <button type="button" className={btn} onClick={() => router.forward()} aria-label="Go forward">
        Forward <span aria-hidden>→</span>
      </button>
      <Link
        href="/"
        className="inline-flex h-9 items-center rounded-lg border border-transparent px-2.5 text-xs font-medium text-muted hover:text-foreground"
      >
        Home
      </Link>
      <Link
        href="/hub"
        className="inline-flex h-9 items-center rounded-lg border border-transparent px-2.5 text-xs font-medium text-accent hover:underline"
      >
        Console
      </Link>
    </nav>
  );
}
