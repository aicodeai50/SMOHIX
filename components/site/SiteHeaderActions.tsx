import Link from "next/link";

import { mFocusRing } from "@/lib/marketing-layout";
import { HEADER_ACTIONS } from "@/lib/site-nav";

export function SiteHeaderActions({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-3">
      {!compact ? (
        <Link
          href={HEADER_ACTIONS.search.href}
          className={`hidden text-[13px] font-medium text-muted transition-colors hover:text-foreground lg:inline ${mFocusRing}`}
        >
          {HEADER_ACTIONS.search.label}
        </Link>
      ) : null}
      <Link
        href={HEADER_ACTIONS.signIn.href}
        className={`hidden text-[13px] font-medium text-muted transition-colors hover:text-foreground md:inline ${mFocusRing}`}
      >
        {HEADER_ACTIONS.signIn.label}
      </Link>
      <a
        href={HEADER_ACTIONS.openAi.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`hidden h-8 max-w-[9.5rem] items-center justify-center rounded-lg px-2.5 text-xs font-semibold min-[480px]:inline-flex sm:max-w-none sm:px-3 ${compact ? 'bg-accent text-background hover:brightness-110' : 'border border-border bg-surface text-foreground hover:border-accent/40'} ${mFocusRing}`}
      >
          <span className="hidden sm:inline">{HEADER_ACTIONS.openAi.label}</span>
          <span className="sm:hidden">AI ↗</span>
      </a>
    </div>
  );
}
