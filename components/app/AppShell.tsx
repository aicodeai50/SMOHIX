"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/site/Logo";

const nav = [
  { href: "/copilot", label: "Copilot" },
  { href: "/incidents", label: "Incidents" },
  { href: "/automations", label: "Automations" },
  { href: "/approvals", label: "Approvals" },
  { href: "/audit", label: "Audit" },
  { href: "/settings/connectors", label: "Connectors" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-accent-dim text-accent"
          : "text-muted hover:bg-surface-elevated/80 hover:text-foreground"
      }`}
    >
      {label}
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
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="shrink-0 border-b border-border bg-surface/90 md:w-56 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4 md:h-16 md:border-0">
          <Link href="/" className="text-foreground no-underline">
            <Logo />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        <div className="hidden flex-col gap-2 border-t border-border p-3 md:flex">
          {authEnabled && userEmail ? (
            <>
              <p className="truncate px-1 font-mono text-[11px] text-muted" title={userEmail}>
                {userEmail}
              </p>
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="w-full rounded-lg border border-border px-3 py-2 text-left text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : authEnabled ? null : (
            <p className="px-1 text-[11px] leading-snug text-muted">
              Auth not configured — set Supabase env vars to require sign-in.
            </p>
          )}
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-xs text-muted hover:text-foreground"
          >
            ← Marketing site
          </Link>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:h-16 md:px-6">
          <span className="font-mono text-xs text-muted">shynvo / console</span>
          {authEnabled && userEmail ? (
            <form action="/auth/sign-out" method="post" className="shrink-0 md:hidden">
              <button
                type="submit"
                className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
