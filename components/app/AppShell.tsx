"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConsoleNavPanel } from "@/components/app/ConsoleNavPanel";
import { AppIcon } from "@/components/icons/AppIcon";
import type { ConsoleModuleIconName } from "@/components/icons/AppIcon";
import { Logo } from "@/components/site/Logo";
import { appMeta, appOverline } from "@/lib/app-typography";
import { CONSOLE_MODULES } from "@/lib/console-nav";

function NavBox({
  href,
  label,
  description,
  icon,
  live,
}: {
  href: string;
  label: string;
  description: string;
  icon: ConsoleModuleIconName;
  live: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`flex min-w-[7.5rem] shrink-0 flex-col rounded-xl border px-3 py-2.5 transition-[border-color,background-color,color,box-shadow] md:min-w-0 ${
        active
          ? "border-accent/50 bg-accent-dim/95 text-foreground shadow-[0_0_0_1px_rgba(94,225,255,0.15),0_0_28px_-10px_rgba(94,225,255,0.22)]"
          : "border-white/[0.06] bg-white/[0.02] text-muted hover:border-accent/35 hover:bg-white/[0.04] hover:text-foreground hover:shadow-[0_0_20px_-12px_rgba(94,225,255,0.18)]"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <AppIcon name={icon} size={20} strokeWidth={1.7} className="text-accent/90" aria-hidden />
        {live ? (
          <span className="rounded-md bg-emerald-500/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300/95 shadow-[0_0_12px_-4px_rgba(52,211,153,0.35)]">
            Live
          </span>
        ) : null}
      </div>
      <span className="mt-1.5 text-[13px] font-semibold text-foreground/95">{label}</span>
      <span className={`mt-0.5 ${appMeta} leading-snug`}>{description}</span>
    </Link>
  );
}

function accountInitial(displayName: string | null, email: string | null): string {
  const src = (displayName ?? email ?? "?").trim();
  const ch = src.charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

export function AppShell({
  children,
  userEmail,
  userDisplayName,
  authEnabled,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  userDisplayName?: string | null;
  authEnabled: boolean;
}) {
  const showName = userDisplayName?.trim() || null;
  return (
    <div className="flex min-h-screen flex-col">
      <aside className="sticky top-0 z-40 shrink-0 border-b border-white/[0.06] bg-[rgba(10,12,18,0.72)] backdrop-blur-xl backdrop-saturate-[1.35]">
        <div className="flex h-14 items-center justify-between gap-3 border-b border-white/[0.05] px-4 md:h-16 md:px-5">
          <Link
            href="/hub"
            className="text-foreground no-underline transition-[opacity,filter] hover:opacity-95 hover:drop-shadow-[0_0_12px_rgba(94,225,255,0.2)]"
          >
            <Logo />
          </Link>
          <span className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] tracking-wide text-muted sm:inline">
            Console
          </span>
        </div>
        <div className="p-2 md:p-3">
          <p className={`mb-2 hidden px-1 md:block ${appOverline}`}>Modules</p>
          <nav
            className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 xl:grid-cols-5 md:pb-0"
            aria-label="Console modules"
          >
            {CONSOLE_MODULES.map((item) => (
              <NavBox key={item.href} {...item} />
            ))}
          </nav>
        </div>
        <div className={`flex flex-wrap items-center gap-2 border-t border-white/[0.05] px-3 py-2.5 md:gap-3 md:px-4 ${appMeta}`}>
          {authEnabled && userEmail ? (
            <>
              <div
                className="flex min-w-0 max-w-[min(100%,280px)] items-center gap-2.5 rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                title={userEmail}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/35 via-accent/15 to-violet-500/25 text-xs font-semibold tracking-tight text-foreground shadow-[0_0_20px_-6px_rgba(94,225,255,0.45)]"
                  aria-hidden
                >
                  {accountInitial(showName, userEmail)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground/95">
                    {showName ?? "Signed in"}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-muted opacity-90">
                    {userEmail}
                  </span>
                </span>
              </div>
              <form action="/auth/sign-out" method="post" className="contents">
                <button
                  type="submit"
                  className="rounded-lg border border-border bg-surface-elevated/50 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : authEnabled ? (
            <span className="text-muted">Signed out</span>
          ) : (
            <span className="max-w-prose leading-relaxed text-muted">
              Local mode: no account sign-in. Copilot still runs with the built-in assistant.
            </span>
          )}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-[13px] font-medium">
            <Link
              href="/docs"
              className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-surface-elevated/40 hover:text-accent"
            >
              Docs
            </Link>
            <AppIcon name="dot" size={4} className="text-muted/45" aria-hidden />
            <Link
              href="/docs/api"
              className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-surface-elevated/40 hover:text-accent"
            >
              API
            </Link>
            <AppIcon name="dot" size={4} className="text-muted/45" aria-hidden />
            <Link
              href="/platform"
              className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-surface-elevated/40 hover:text-accent"
            >
              Platform
            </Link>
            <AppIcon name="dot" size={4} className="text-muted/45" aria-hidden />
            <Link
              href="/"
              className="rounded-lg px-2.5 py-1 text-muted transition-colors hover:bg-surface-elevated/40 hover:text-foreground"
            >
              Website
            </Link>
          </div>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-4 md:p-8 md:pb-10">
          <ConsoleNavPanel />
          {children}
        </div>
      </div>
    </div>
  );
}
