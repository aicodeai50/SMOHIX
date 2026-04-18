"use client";

import { useRouter } from "next/navigation";

const btn =
  "inline-flex h-9 items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs font-semibold text-muted transition-colors hover:border-accent/30 hover:text-foreground";

export function MarketingHistoryNav() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-1.5" aria-label="Browser history">
      <button type="button" className={btn} onClick={() => router.back()} aria-label="Go back">
        ←
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => router.forward()}
        aria-label="Go forward"
      >
        →
      </button>
    </div>
  );
}
