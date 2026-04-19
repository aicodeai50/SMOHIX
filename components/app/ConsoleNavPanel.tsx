"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppIcon } from "@/components/icons/AppIcon";
import { getConsoleBreadcrumbs } from "@/lib/console-breadcrumbs";
import { appMeta } from "@/lib/app-typography";
import { CONSOLE_MODULES } from "@/lib/console-nav";

export function ConsoleNavPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = getConsoleBreadcrumbs(pathname);
  const [jumpKey, setJumpKey] = useState(0);

  useEffect(() => {
    setJumpKey((k) => k + 1);
  }, [pathname]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const goForward = useCallback(() => {
    router.forward();
  }, [router]);

  return (
    <nav
      className="sticky top-0 z-30 -mx-4 mb-4 border-b border-white/[0.08] bg-[rgba(8,10,15,0.92)] px-3 py-2.5 shadow-[0_8px_32px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl md:-mx-8 md:px-6"
      aria-label="Page and history navigation"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 font-semibold text-foreground/90 transition-colors hover:border-accent/35 hover:bg-white/[0.07] hover:text-accent ${appMeta}`}
            aria-label="Go back in browser history"
          >
            <AppIcon name="chevronLeft" size={14} className="text-muted" aria-hidden />
            Back
          </button>
          <button
            type="button"
            onClick={goForward}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-xs font-semibold text-foreground/90 transition-colors hover:border-accent/35 hover:bg-white/[0.07] hover:text-accent"
            aria-label="Go forward in browser history"
          >
            Forward
            <AppIcon name="chevronRight" size={14} className="text-muted" aria-hidden />
          </button>
        </div>

        <div
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px] sm:justify-center"
          aria-label="Breadcrumb"
        >
          {crumbs.map((c, i) => (
            <span key={`${c.href}-${i}`} className="flex items-center gap-1">
              {i > 0 ? (
                <span className="select-none text-muted/60" aria-hidden>
                  /
                </span>
              ) : null}
              <Link
                href={c.href}
                className={
                  i === crumbs.length - 1
                    ? "truncate font-semibold text-foreground/95 hover:text-accent"
                    : "truncate text-muted transition-colors hover:text-accent"
                }
              >
                {c.label}
              </Link>
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor="console-jump" className="sr-only">
            Jump to module
          </label>
          <select
            id="console-jump"
            key={jumpKey}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                router.push(v);
                setJumpKey((k) => k + 1);
              }
            }}
            className={`h-9 max-w-[11rem] cursor-pointer rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 font-medium text-foreground/90 outline-none ring-accent/25 focus:border-accent/40 focus:ring-2 sm:max-w-[14rem] ${appMeta}`}
          >
            <option value="">Jump to…</option>
            {CONSOLE_MODULES.map((m) => (
              <option key={m.href} value={m.href}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
