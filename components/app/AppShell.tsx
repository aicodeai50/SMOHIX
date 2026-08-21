"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ConsoleNavPanel } from "@/components/app/ConsoleNavPanel";
import { ProductWorkspaceSwitcher } from "@/components/app/ProductWorkspaceSwitcher";
import { AppIcon } from "@/components/icons/AppIcon";
import { Logo } from "@/components/site/Logo";
import { appMeta, appOverline } from "@/lib/app-typography";
import {
  CONSOLE_MANAGE_LINKS,
  CONSOLE_MODULES,
  groupModulesForNav,
  moduleBadgeLabel,
  shouldShowModuleBadge,
  type ConsoleModuleMaturity,
} from "@/lib/console-nav";
import { SMOHIX_WORKSPACE_URLS } from "@/lib/ecosystem-workspaces";

type ModuleItem = (typeof CONSOLE_MODULES)[number];

function maturityClassName(maturity: ConsoleModuleMaturity): string {
  if (maturity === "beta") return "bg-amber-400/14 text-amber-200/95";
  if (maturity === "internal") return "bg-sky-400/14 text-sky-200/95";
  if (maturity === "planned") return "bg-white/[0.08] text-muted";
  return "bg-emerald-500/16 text-emerald-300/95";
}

function NavTile({ href, label, description, icon, maturity, pinned }: ModuleItem & { pinned?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const badge = shouldShowModuleBadge(maturity) ? moduleBadgeLabel(maturity) : null;
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
        <span className="flex items-center gap-1">
          {pinned ? <AppIcon name="pin" size={12} className="text-accent/75" aria-hidden /> : null}
          {badge ? (
            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${maturityClassName(maturity)}`}>
              {badge}
            </span>
          ) : null}
        </span>
      </div>
      <span className="mt-1.5 text-[13px] font-semibold text-foreground/95">{label}</span>
      <span className={`mt-0.5 ${appMeta} leading-snug`}>{description}</span>
    </Link>
  );
}

function NavRailLink({
  href,
  label,
  description,
  icon,
  maturity,
  pinned,
}: ModuleItem & { pinned?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const badge = shouldShowModuleBadge(maturity) ? moduleBadgeLabel(maturity) : null;
  return (
    <Link
      href={href}
      title={`${label} — ${description}${pinned ? " (pinned)" : ""}`}
      className={`flex min-h-0 items-center gap-2.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
        active
          ? "border-accent/40 bg-accent-dim/70 text-foreground shadow-[0_0_0_1px_rgba(94,225,255,0.12)]"
          : pinned
            ? "border-accent/20 bg-accent/[0.04] text-muted hover:border-accent/30 hover:bg-accent/[0.07] hover:text-foreground"
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
      {pinned ? <AppIcon name="pin" size={12} className="shrink-0 text-accent/70" aria-hidden /> : null}
      {badge ? (
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${maturityClassName(maturity)}`}
          title={`${badge} module`}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function ManageLink({
  href,
  label,
  description,
  icon,
}: (typeof CONSOLE_MANAGE_LINKS)[number]) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      title={`${label} — ${description}`}
      className={`flex min-h-0 items-center gap-2.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
        active
          ? "border-accent/40 bg-accent-dim/70 text-foreground"
          : "border-transparent text-muted hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-foreground"
      }`}
    >
      <AppIcon name={icon} size={16} strokeWidth={1.7} className="shrink-0 text-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left text-[12px] font-medium tracking-tight">
        {label}
      </span>
    </Link>
  );
}

function IntelligenceExternalLinks() {
  const links = [
    { href: SMOHIX_WORKSPACE_URLS.ai, label: "Smohix AI", status: "Live" as const },
    { href: SMOHIX_WORKSPACE_URLS.assistant, label: "Assistant", status: "Preview" as const },
    { href: SMOHIX_WORKSPACE_URLS.privateAi, label: "PRI", status: "Preview" as const },
  ];
  return (
    <ul className="space-y-0.5">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-1.5 text-muted transition-colors hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-foreground"
          >
            <span className="truncate text-[12px] font-medium">
              {link.label} <span aria-hidden>↗</span>
            </span>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                link.status === "Live"
                  ? "bg-emerald-500/16 text-emerald-300/95"
                  : "bg-amber-400/14 text-amber-200/95"
              }`}
            >
              {link.status}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function accountInitial(displayName: string | null, email: string | null): string {
  const src = (displayName ?? email ?? "?").trim();
  const ch = src.charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

function ResourcesFooter() {
  return (
    <div className={`flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] font-medium text-muted ${appMeta}`}>
      <Link href="/docs" className="rounded px-1.5 py-0.5 hover:bg-white/[0.05] hover:text-accent">
        Docs
      </Link>
      <span className="text-muted/40" aria-hidden>
        ·
      </span>
      <Link href="/docs/api" className="rounded px-1.5 py-0.5 hover:bg-white/[0.05] hover:text-accent">
        API
      </Link>
      <span className="text-muted/40" aria-hidden>
        ·
      </span>
      <Link href="/platform" className="rounded px-1.5 py-0.5 hover:bg-white/[0.05] hover:text-accent">
        Platform
      </Link>
      <span className="text-muted/40" aria-hidden>
        ·
      </span>
      <Link href="/" className="rounded px-1.5 py-0.5 hover:bg-white/[0.05] hover:text-foreground">
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
  navModules = CONSOLE_MODULES,
  pinnedNavHrefs = [],
  auditorWorkspace = false,
}: {
  children: React.ReactNode;
  userEmail: string | null;
  userDisplayName?: string | null;
  authEnabled: boolean;
  navModules?: readonly ModuleItem[];
  pinnedNavHrefs?: readonly string[];
  auditorWorkspace?: boolean;
}) {
  const showName = userDisplayName?.trim() || null;
  const pathname = usePathname();
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);
  const pinnedSet = new Set(pinnedNavHrefs);
  const grouped = groupModulesForNav([...navModules]);

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

  const accountSection = (
    <div className={`space-y-2 ${appMeta}`}>
      {authEnabled && userEmail ? (
        <>
          {userBlock}
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-center text-[11px] font-medium text-muted transition-colors hover:border-accent/35 hover:text-foreground"
            >
              Account
            </Link>
            <form action="/auth/sign-out" method="post" className="flex-1">
              <button
                type="submit"
                className="w-full rounded-lg border border-border bg-surface-elevated/40 px-2.5 py-1.5 text-[11px] font-medium text-muted/90 transition-colors hover:border-white/[0.14] hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </>
      ) : authEnabled ? (
        <span className="text-muted">Signed out</span>
      ) : (
        <span className="leading-relaxed text-muted">
          Local mode — core console routes work without account sign-in.
        </span>
      )}
      <ResourcesFooter />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-[100dvh] lg:flex-row lg:overflow-hidden">
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
            {mobileModulesOpen ? "Close" : "Menu"}
          </button>
        </div>
        {!mobileModulesOpen ? (
          <div className="border-t border-white/[0.05] px-3 py-2">
            <ProductWorkspaceSwitcher compact />
          </div>
        ) : null}
      </div>

      {mobileModulesOpen ? (
        <div
          id="console-mobile-modules"
          className="max-h-[min(78vh,640px)] shrink-0 overflow-y-auto border-b border-white/[0.08] bg-[rgba(10,12,18,0.98)] lg:hidden"
        >
          <div className="space-y-3 p-3">
            <ProductWorkspaceSwitcher />
            {grouped.map((group) => (
              <div key={group.id}>
                <p className={appOverline}>{group.label}</p>
                {group.modules.length > 0 ? (
                  <nav className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label={group.label}>
                    {group.modules.map((item) => (
                      <NavTile key={item.href} {...item} pinned={pinnedSet.has(item.href)} />
                    ))}
                  </nav>
                ) : null}
                {group.id === "intelligence" ? (
                  <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
                    <IntelligenceExternalLinks />
                  </div>
                ) : null}
                {group.id === "manage" ? (
                  <div className="mt-2 space-y-0.5">
                    {CONSOLE_MANAGE_LINKS.map((link) => (
                      <ManageLink key={link.href} {...link} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] p-3">{accountSection}</div>
        </div>
      ) : null}

      <aside className="hidden h-full w-[17.5rem] shrink-0 flex-col border-r border-white/[0.06] bg-[rgba(10,12,18,0.94)] shadow-[inset_-1px_0_0_rgba(94,225,255,0.05)] backdrop-blur-xl backdrop-saturate-[1.35] lg:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-white/[0.06] px-3">
          <Link
            href="/hub"
            className="min-w-0 text-foreground no-underline transition-opacity hover:opacity-90"
          >
            <Logo />
          </Link>
        </div>
        <div className="shrink-0 space-y-2 border-b border-white/[0.06] px-3 py-3">
          <p className={appOverline}>Workspace</p>
          <ProductWorkspaceSwitcher />
        </div>
        <nav
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-2"
          aria-label="Console navigation"
        >
          {grouped.map((group) => (
            <div key={group.id}>
              <p className={`px-2 pb-1 ${appOverline}`}>{group.label}</p>
              <div className="flex flex-col gap-0.5">
                {group.modules.map((item) => (
                  <NavRailLink key={item.href} {...item} pinned={pinnedSet.has(item.href)} />
                ))}
                {group.id === "intelligence" ? <IntelligenceExternalLinks /> : null}
                {group.id === "manage"
                  ? CONSOLE_MANAGE_LINKS.map((link) => <ManageLink key={link.href} {...link} />)
                  : null}
              </div>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/[0.06] p-3">{accountSection}</div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
        <div className="smohix-console-main mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-y-auto overscroll-contain p-4 md:p-8 md:pb-10">
          <ConsoleNavPanel pinnedNavHrefs={pinnedNavHrefs} />
          {!authEnabled ? (
            <p className={`mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-amber-100 ${appMeta}`}>
              Local demo workspace: authentication, shared organization data, and durable history are not
              configured in this environment.
            </p>
          ) : null}
          {auditorWorkspace ? (
            <p className={`mb-4 rounded-xl border border-indigo-400/35 bg-indigo-400/10 px-4 py-3 text-indigo-100 ${appMeta}`}>
              Auditor read-only workspace — SOC 2 Type II monitoring, compliance mapping, and audit log
              only. Change management and automation controls are not available in this role.
            </p>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
