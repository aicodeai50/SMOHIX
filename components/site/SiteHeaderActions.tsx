import Link from "next/link";

import { Button } from "@/components/ui/Button";
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
        className="hidden min-[480px]:inline-flex sm:inline-flex"
      >
        <Button size="sm" variant={compact ? "primary" : "secondary"} className="max-w-[9.5rem] truncate px-2.5 sm:max-w-none sm:px-3">
          <span className="hidden sm:inline">{HEADER_ACTIONS.openAi.label}</span>
          <span className="sm:hidden">AI ↗</span>
        </Button>
      </a>
    </div>
  );
}
