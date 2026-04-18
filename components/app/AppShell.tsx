"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getConsoleBackLink } from "@/lib/console-back";
import { Logo } from "@/components/site/Logo";
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
  icon: string;
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
        <span className="text-lg leading-none" aria-hidden>
          {icon}
        </span>
        {live ? (
          <span className="rounded-md bg-emerald-500/18 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300/95 shadow-[0_0_12px_-4px_rgba(52,211,153,0.35)]">
            Live
          </span>
        ) : null}
      </div>
      <span className="mt-1.5 text-xs font-semibold text-foreground/95">{label}</span>
      <span className="mt-0.5 text-[11px] leading-snug text-muted">{description}</span>
    </Link>
  );
}

function ConsoleBackBar() {
  const pathname = usePathname();
  const router = useRouter();
  const back = getConsoleBackLink(pathname);
  if (!back) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-white/[0.06] pb-3 md:mb-5">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back in browser history"
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground"
      >
        <span aria-hidden>←</span>
        Back
      </button>
      <Link
        href={back.href}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
      >
        <span aria-hidden>←</span>
        {back.label}
      </Link>
    </div>
  );
}

export function AppShell({
  children,
  userEmail,
  authEnabled,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  authEnabled: boolean;
}) {
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
          <p className="mb-2 hidden px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted md:block">
            Modules
          </p>
          <nav
            className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 xl:grid-cols-5 md:pb-0"
            aria-label="Console modules"
          >
            {CONSOLE_MODULES.map((item) => (
              <NavBox key={item.href} {...item} />
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.05] px-3 py-2.5 text-[11px] text-muted md:gap-3 md:px-4">
          {authEnabled && userEmail ? (
            <>
              <span
                className="inline-flex max-w-[min(100%,220px)] items-center truncate rounded-lg border border-border/70 bg-background/25 px-2.5 py-1 font-mono text-[10px] text-foreground/85"
                title={userEmail}
              >
                {userEmail}
              </span>
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
            <span className="max-w-prose leading-relaxed">
              Local mode: no Supabase auth. Copilot posts to{" "}
              <code className="rounded bg-background/50 px-1 py-px font-mono text-[10px] text-accent/95">
                /api/copilot/chat
              </code>
              .
            </span>
          )}
          <Link
            href="/"
            className="ml-auto rounded-lg px-2.5 py-1 font-medium text-muted transition-colors hover:bg-surface-elevated/40 hover:text-foreground"
          >
            Website
          </Link>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-4 md:p-8 md:pb-10">
          <ConsoleBackBar />
          {children}
        </div>
      </div>
    </div>
  );
}
