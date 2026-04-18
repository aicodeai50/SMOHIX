"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
      className={`flex min-w-[7.5rem] shrink-0 flex-col rounded-xl border px-3 py-2.5 transition-colors md:min-w-0 ${
        active
          ? "border-accent/50 bg-accent-dim/80 text-foreground"
          : "border-border bg-surface/60 text-muted hover:border-accent/35 hover:bg-surface-elevated/50 hover:text-foreground"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-lg leading-none" aria-hidden>
          {icon}
        </span>
        {live ? (
          <span className="rounded bg-emerald-500/15 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-emerald-400/95">
            Live
          </span>
        ) : null}
      </div>
      <span className="mt-1.5 text-xs font-semibold text-foreground/95">{label}</span>
      <span className="mt-0.5 text-[10px] leading-snug opacity-80">{description}</span>
    </Link>
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
      <aside className="shrink-0 border-b border-border bg-surface/90">
        <div className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 md:h-16 md:px-5">
          <Link href="/hub" className="text-foreground no-underline">
            <Logo />
          </Link>
          <span className="hidden font-mono text-[10px] text-muted sm:inline">shynvo · console</span>
        </div>
        <div className="p-2 md:p-3">
          <p className="mb-2 hidden px-1 text-[10px] font-medium uppercase tracking-wider text-muted md:block">
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
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-3 py-2 text-[11px] text-muted md:px-4">
          {authEnabled && userEmail ? (
            <>
              <span className="max-w-[200px] truncate font-mono" title={userEmail}>
                {userEmail}
              </span>
              <form action="/auth/sign-out" method="post" className="ml-auto md:ml-0">
                <button
                  type="submit"
                  className="rounded-lg border border-border px-2 py-1 text-left text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : authEnabled ? (
            <span className="text-muted">Signed out</span>
          ) : (
            <span className="max-w-prose leading-snug">
              No Supabase auth — full console is open locally. Copilot uses{" "}
              <span className="font-mono text-foreground/80">/api/copilot/chat</span>.
            </span>
          )}
          <Link
            href="/"
            className="ml-auto rounded-lg px-2 py-1 hover:text-foreground md:ml-0 md:ml-auto"
          >
            ← Marketing
          </Link>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
