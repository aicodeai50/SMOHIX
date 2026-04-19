"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ConsoleNavPanel } from "@/components/app/ConsoleNavPanel";
import { AppIcon } from "@/components/icons/AppIcon";
import { Logo } from "@/components/site/Logo";
import { appMeta, appOverline } from "@/lib/app-typography";
import { CONSOLE_MODULES } from "@/lib/console-nav";

type ModuleItem = (typeof CONSOLE_MODULES)[number];

function NavTile({ href, label, description, icon, live }: ModuleItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`flex min-w-0 shrink-0 flex-col rounded-xl border px-3 py-2.5 transition-[border-color,background-color,color,box-shadow] ${
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

function NavRailLink({ href, label, description, icon, live }: ModuleItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      title={`${label} — ${description}`}
      className={`flex min-h-0 items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors ${
        active
          ? "border-accent/40 bg-accent-dim/70 text-foreground shadow-[0_0_0_1px_rgba(94,225,255,0.12)]"
          : "border-transparent text-muted hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-foreground"
      }`}
    >
      <AppIcon
        name={icon}
        size={18}
        strokeWidth={1.7}
        className={active ? "shrink-0 text-accent" : "shrink-0 text-muted"}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold tracking-tight">
        {label}
      </span>
      {live ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.45)]"
          title="Live"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

function accountInitial(displayName: string | null, email: string | null): string {
  const src = (displayName ?? email ?? "?").trim();
  const ch = src.charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function ExternalLinksRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] font-medium ${className}`}>
      <Link
        href="/docs"
        className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-white/[0.05] hover:text-accent"
      >
        Docs
      </Link>
      <AppIcon name="dot" size={4} className="text-muted/45" aria-hidden />
      <Link
        href="/docs/api"
        className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-white/[0.05] hover:text-accent"
      >
        API
      </Link>
      <AppIcon name="dot" size={4} className="text-muted/45" aria-hidden />
      <Link
        href="/platform"
        className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-white/[0.05] hover:text-accent"
      >
        Platform
      </Link>
      <AppIcon name="dot" size={4} className="text-muted/45" aria-hidden />
      <Link
        href="/"
        className="rounded-lg px-2 py-1 text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground"
      >
        Website
      </Link>
    </div>
  );
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
  const pathname = usePathname();
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMobileModulesOpen(false);
    });
  }, [pathname]);

  const userBlock = authEnabled && userEmail && (
    <div
      className="flex min-w-0 max-w-full items-center gap-2.5 rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
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
        <span className="block truncate font-mono text-[10px] text-muted opacity-90">{userEmail}</span>
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-[100dvh] lg:flex-row lg:overflow-hidden">
      {/* Mobile: primary chrome — does not consume vertical space like the old full module wall */}
      <div className="sticky top-0 z-50 shrink-0 border-b border-white/[0.08] bg-[rgba(8,10,15,0.96)] backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-3">
          <Link
            href="/hub"
            className="min-w-0 shrink text-foreground no-underline transition-opacity hover:opacity-90"
          >
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setMobileModulesOpen((o) => !o)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 text-[13px] font-semibold text-foreground/90 transition-colors hover:border-accent/35 hover:bg-white/[0.08]"
            aria-expanded={mobileModulesOpen}
            aria-controls="console-mobile-modules"
          >
            <AppIcon name={mobileModulesOpen ? "close" : "menu"} size={18} aria-hidden />
            {mobileModulesOpen ? "Close" : "Modules"}
          </button>
        </div>
        {!mobileModulesOpen ? (
          <div
            className={`flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] px-3 py-2 ${appMeta}`}
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {userBlock}
              {authEnabled && userEmail ? (
                <form action="/auth/sign-out" method="post" className="shrink-0">
                  <button
                    type="submit"
                    className="rounded-lg border border-border bg-surface-elevated/50 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground"
                  >
                    Sign out
                  </button>
                </form>
              ) : authEnabled ? (
                <span className="text-muted">Signed out</span>
              ) : (
                <span className="max-w-[14rem] truncate leading-relaxed text-muted">
                  Local mode — no account sign-in.
                </span>
              )}
            </div>
            <ExternalLinksRow className="shrink-0 justify-end" />
          </div>
        ) : null}
      </div>

      {mobileModulesOpen ? (
        <div
          id="console-mobile-modules"
          className="max-h-[min(72vh,560px)] shrink-0 overflow-y-auto border-b border-white/[0.08] bg-[rgba(10,12,18,0.98)] lg:hidden"
        >
          <p className={`px-3 pt-3 ${appOverline}`}>Modules</p>
          <nav
            className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3"
            aria-label="Console modules"
          >
            {CONSOLE_MODULES.map((item) => (
              <NavTile key={item.href} {...item} />
            ))}
          </nav>
          <div className={`space-y-2 border-t border-white/[0.06] p-3 ${appMeta}`}>
            {authEnabled && userEmail ? (
              <div className="flex flex-wrap items-center gap-2">
                {userBlock}
                <form action="/auth/sign-out" method="post">
                  <button
                    type="submit"
                    className="rounded-lg border border-border bg-surface-elevated/50 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : null}
            <ExternalLinksRow />
          </div>
        </div>
      ) : null}

      {/* Desktop: fixed-width rail — main content scrolls independently in the right column */}
      <aside className="hidden h-full w-[17.25rem] shrink-0 flex-col border-r border-white/[0.06] bg-[rgba(10,12,18,0.94)] shadow-[inset_-1px_0_0_rgba(94,225,255,0.05)] backdrop-blur-xl backdrop-saturate-[1.35] lg:flex">
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3">
          <Link
            href="/hub"
            className="min-w-0 text-foreground no-underline transition-opacity hover:opacity-90"
          >
            <Logo />
          </Link>
          <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted">
            Console
          </span>
        </div>
        <p className={`shrink-0 px-3 pt-3 ${appOverline}`}>Modules</p>
        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-2"
          aria-label="Console modules"
        >
          {CONSOLE_MODULES.map((item) => (
            <NavRailLink key={item.href} {...item} />
          ))}
        </nav>
        <div className={`shrink-0 space-y-2.5 border-t border-white/[0.06] p-3 ${appMeta}`}>
          {authEnabled && userEmail ? (
            <>
              {userBlock}
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="w-full rounded-lg border border-border bg-surface-elevated/50 px-2.5 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : authEnabled ? (
            <span className="text-muted">Signed out</span>
          ) : (
            <span className="leading-relaxed text-muted">
              Local mode: no account sign-in. Copilot still runs with the built-in assistant.
            </span>
          )}
          <ExternalLinksRow className="pt-1" />
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
        <div className="shynvo-console-main mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-y-auto overscroll-contain p-4 md:p-8 md:pb-10">
          <ConsoleNavPanel />
          {children}
        </div>
      </main>
    </div>
  );
}
