import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { mFocusRing } from "@/lib/marketing-layout";
import { HEADER_ACTIONS } from "@/lib/site-nav";

export function SiteHeaderActions({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {!compact ? (
        <Link
          href={HEADER_ACTIONS.search.href}
          className={`hidden text-[13px] font-medium text-muted transition-colors hover:text-foreground md:inline ${mFocusRing}`}
        >
          {HEADER_ACTIONS.search.label}
        </Link>
      ) : null}
      <Link
        href={HEADER_ACTIONS.signIn.href}
        className={`hidden text-[13px] font-medium text-muted transition-colors hover:text-foreground sm:inline ${mFocusRing}`}
      >
        {HEADER_ACTIONS.signIn.label}
      </Link>
      <a
        href={HEADER_ACTIONS.openAi.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <Button size="sm" variant={compact ? "primary" : "secondary"}>
          {HEADER_ACTIONS.openAi.label}
        </Button>
      </a>
    </div>
  );
}
