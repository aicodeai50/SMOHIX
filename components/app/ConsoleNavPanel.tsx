"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppIcon } from "@/components/icons/AppIcon";
import { getConsoleBreadcrumbs } from "@/lib/console-breadcrumbs";
import { mergeIdleJumpModules } from "@/lib/console/hub-personalization";
import { appMeta } from "@/lib/app-typography";
import { CONSOLE_MODULES } from "@/lib/console-nav";

const HUB_PREFS_STORAGE_KEY = "smohix.hub.personalization";
const LEGACY_HUB_PREFS_STORAGE_KEY = "zentro.hub.personalization";

const SEARCH_ALIASES: ReadonlyArray<{ alias: string; targets: readonly string[] }> = [
  { alias: "gov", targets: ["/governance/policies", "/governance/access"] },
  { alias: "policy", targets: ["/governance/policies"] },
  { alias: "rbac", targets: ["/governance/access"] },
  { alias: "mfa", targets: ["/governance/access"] },
  { alias: "cert", targets: ["/assets/certificates"] },
  { alias: "secret", targets: ["/assets/secrets"] },
  { alias: "net", targets: ["/assets/network"] },
  { alias: "dr", targets: ["/resilience/backups"] },
  { alias: "backup", targets: ["/resilience/backups"] },
  { alias: "playbook", targets: ["/automations"] },
  { alias: "workflow", targets: ["/automations", "/changes"] },
  { alias: "approval", targets: ["/approvals"] },
  { alias: "compliance", targets: ["/audit"] },
  { alias: "apikey", targets: ["/settings/api-keys"] },
  { alias: "api", targets: ["/settings/api-keys", "/docs/api"] },
  { alias: "billing", targets: ["/settings/billing"] },
  { alias: "connector", targets: ["/settings/connectors"] },
  { alias: "incident", targets: ["/incidents"] },
  { alias: "service", targets: ["/services"] },
  { alias: "runbook", targets: ["/runbooks"] },
];
const RECENT_MODULES_STORAGE_KEY = "smohix.console.recent-modules";
const LEGACY_RECENT_MODULES_STORAGE_KEY = "zentro.console.recent-modules";
const MAX_RECENT_MODULES = 5;

function readMigratedLocalStorage(newKey: string, legacyKey: string): string | null {
  const current = window.localStorage.getItem(newKey);
  if (current !== null) return current;
  const legacy = window.localStorage.getItem(legacyKey);
  if (legacy === null) return null;
  window.localStorage.setItem(newKey, legacy);
  window.localStorage.removeItem(legacyKey);
  return legacy;
}
const SEARCH_LINKS = [
  { href: "/docs", label: "Docs", description: "Knowledge base" },
  { href: "/docs/api", label: "API", description: "API reference" },
  { href: "/platform", label: "Platform", description: "Product surface" },
  { href: "/", label: "Website", description: "Public homepage" },
] as const;

type SearchEntry = {
  href: string;
  label: string;
  description: string;
  maturity?: (typeof CONSOLE_MODULES)[number]["maturity"];
};

function maturityLabel(maturity: NonNullable<SearchEntry["maturity"]>): string {
  return maturity === "core" ? "Core" : maturity === "beta" ? "Beta" : maturity === "internal" ? "Internal" : "Planned";
}

function fuzzyScore(query: string, text: string): number {
  if (!query) return 0;
  if (text.includes(query)) return 1000 - text.indexOf(query);

  let qi = 0;
  let lastMatch = -1;
  let score = 0;
  for (let i = 0; i < text.length && qi < query.length; i += 1) {
    if (text[i] !== query[qi]) continue;
    score += lastMatch >= 0 && i === lastMatch + 1 ? 4 : 2;
    lastMatch = i;
    qi += 1;
  }
  if (qi !== query.length) return -1;
  return score;
}

function renderHighlightedText(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const start = lowerText.indexOf(lowerQuery);
  if (start < 0) return text;
  const end = start + q.length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded bg-accent/20 px-0.5 text-foreground">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export function ConsoleNavPanel({ pinnedNavHrefs = [] }: { pinnedNavHrefs?: readonly string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = getConsoleBreadcrumbs(pathname);
  const [jumpReset, setJumpReset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [recentModuleHrefs, setRecentModuleHrefs] = useState<string[]>([]);
  const [localPinnedHrefs, setLocalPinnedHrefs] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const searchCatalog = useMemo(
    () => {
      const entries: SearchEntry[] = [
        ...CONSOLE_MODULES.map((m) => ({
          href: m.href,
          label: m.label,
          description: m.description,
          maturity: m.maturity,
        })),
        ...SEARCH_LINKS.map((m) => ({
          href: m.href,
          label: m.label,
          description: m.description,
        })),
      ];
      return entries;
    },
    [],
  );
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const aliasHit = SEARCH_ALIASES.find((entry) => q.includes(entry.alias));
    const aliasTargetBoost = new Set(aliasHit?.targets ?? []);
    return searchCatalog.map((m) => {
      const haystack = `${m.label} ${m.description} ${m.href}`.toLowerCase();
      const baseScore = fuzzyScore(q, haystack);
      if (baseScore < 0) {
        return { module: m, score: -1 };
      }
      const boostedScore = baseScore + (aliasTargetBoost.has(m.href) ? 500 : 0);
      return { module: m, score: boostedScore };
    })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((entry) => entry.module);
  }, [searchCatalog, searchQuery]);
  const effectivePinnedHrefs = pinnedNavHrefs.length > 0 ? pinnedNavHrefs : localPinnedHrefs;
  const idleJumpModules = useMemo(
    () =>
      mergeIdleJumpModules(
        CONSOLE_MODULES.map((m) => ({
          href: m.href,
          label: m.label,
          description: m.description,
          maturity: m.maturity,
        })),
        effectivePinnedHrefs,
        recentModuleHrefs,
      ),
    [effectivePinnedHrefs, recentModuleHrefs],
  );
  const visibleSearchResults = searchQuery.trim() ? searchResults : idleJumpModules;
  const idleListLabel =
    effectivePinnedHrefs.length > 0 && recentModuleHrefs.length > 0
      ? "Pinned & recent"
      : effectivePinnedHrefs.length > 0
        ? "Pinned modules"
        : "Recently opened";

  useEffect(() => {
    if (searchResults.length === 0) {
      queueMicrotask(() => setActiveSearchIndex(-1));
      return;
    }
    if (activeSearchIndex >= searchResults.length) {
      queueMicrotask(() => setActiveSearchIndex(0));
    }
  }, [activeSearchIndex, searchResults]);

  useEffect(() => {
    if (pinnedNavHrefs.length > 0) return;
    const raw = readMigratedLocalStorage(HUB_PREFS_STORAGE_KEY, LEGACY_HUB_PREFS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { pinnedHrefs?: unknown };
      if (!Array.isArray(parsed.pinnedHrefs)) return;
      const valid = parsed.pinnedHrefs
        .filter((value): value is string => typeof value === "string")
        .filter((href) => CONSOLE_MODULES.some((module) => module.href === href));
      queueMicrotask(() => setLocalPinnedHrefs(valid));
    } catch {
      // Ignore malformed local payloads.
    }
  }, [pinnedNavHrefs]);

  useEffect(() => {
    const raw = readMigratedLocalStorage(
      RECENT_MODULES_STORAGE_KEY,
      LEGACY_RECENT_MODULES_STORAGE_KEY,
    );
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const valid = parsed
        .filter((value): value is string => typeof value === "string")
        .filter((href) => CONSOLE_MODULES.some((module) => module.href === href))
        .slice(0, MAX_RECENT_MODULES);
      queueMicrotask(() => setRecentModuleHrefs(valid));
    } catch {
      // Ignore malformed storage payloads and continue with empty recents.
    }
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (searchPanelRef.current?.contains(targetNode)) return;
      queueMicrotask(() => {
        setSearchOpen(false);
        setActiveSearchIndex(-1);
      });
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const recordRecentModule = useCallback((href: string) => {
    setRecentModuleHrefs((prev) => {
      const next = [href, ...prev.filter((item) => item !== href)].slice(0, MAX_RECENT_MODULES);
      window.localStorage.setItem(RECENT_MODULES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [setRecentModuleHrefs]);

  useEffect(() => {
    const matchedModule = CONSOLE_MODULES.find(
      (module) => pathname === module.href || pathname.startsWith(`${module.href}/`),
    );
    if (!matchedModule) return;
    queueMicrotask(() => {
      recordRecentModule(matchedModule.href);
    });
  }, [pathname, recordRecentModule]);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const goForward = useCallback(() => {
    router.forward();
  }, [router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isQuickOpen = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isQuickOpen) return;

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 font-semibold text-foreground/90 transition-colors hover:border-accent/35 hover:bg-white/[0.07] hover:text-accent ${appMeta}`}
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
          <div ref={searchPanelRef} className="relative">
            <label htmlFor="console-search" className="sr-only">
              Search console modules
            </label>
            <input
              id="console-search"
              ref={searchInputRef}
              value={searchQuery}
              role="combobox"
              aria-expanded={searchOpen}
              aria-controls="console-search-results"
              aria-autocomplete="list"
              aria-activedescendant={
                activeSearchIndex >= 0
                  ? `console-search-option-${visibleSearchResults[activeSearchIndex]?.href ?? "none"}`
                  : undefined
              }
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveSearchIndex(-1);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && visibleSearchResults.length > 0) {
                  e.preventDefault();
                  setActiveSearchIndex((i) => (i + 1) % visibleSearchResults.length);
                  return;
                }
                if (e.key === "ArrowUp" && visibleSearchResults.length > 0) {
                  e.preventDefault();
                  setActiveSearchIndex((i) => (i <= 0 ? visibleSearchResults.length - 1 : i - 1));
                  return;
                }
                if (
                  e.key === "Enter" &&
                  (visibleSearchResults[activeSearchIndex] ?? visibleSearchResults[0])
                ) {
                  e.preventDefault();
                  const selected = visibleSearchResults[activeSearchIndex] ?? visibleSearchResults[0];
                  router.push(selected.href);
                  recordRecentModule(selected.href);
                  setSearchQuery("");
                  setActiveSearchIndex(-1);
                  setSearchOpen(false);
                }
                if (e.key === "Escape") {
                  setSearchQuery("");
                  setActiveSearchIndex(-1);
                  setSearchOpen(false);
                }
              }}
              placeholder="Search modules or paths... (Ctrl/Cmd+K)"
              className={`h-9 w-[13rem] rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 text-foreground/90 outline-none ring-accent/25 placeholder:text-muted/80 focus:border-accent/40 focus:ring-2 sm:w-[16rem] ${appMeta}`}
            />
            {searchOpen && visibleSearchResults.length > 0 ? (
              <div className="absolute right-0 top-[calc(100%+0.4rem)] z-40 w-[min(22rem,80vw)] rounded-xl border border-white/[0.1] bg-[rgba(10,12,18,0.98)] p-1.5 shadow-[0_18px_48px_-22px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-2 px-2 py-1">
                  <p className={`${appMeta} text-muted`}>
                    {searchQuery.trim() ? "Search results" : idleListLabel}
                  </p>
                  {!searchQuery.trim() && recentModuleHrefs.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRecentModuleHrefs([]);
                        window.localStorage.removeItem(RECENT_MODULES_STORAGE_KEY);
                        setActiveSearchIndex(-1);
                      }}
                      className={`${appMeta} rounded-md px-1.5 py-0.5 text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground`}
                    >
                      Clear recent
                    </button>
                  ) : null}
                </div>
                <ul id="console-search-results" role="listbox" className="max-h-64 overflow-y-auto">
                  {visibleSearchResults.map((m, index) => (
                    <li key={m.href} role="presentation">
                      <button
                        id={`console-search-option-${m.href}`}
                        type="button"
                        role="option"
                        aria-selected={activeSearchIndex === index}
                        onClick={() => {
                          router.push(m.href);
                          recordRecentModule(m.href);
                          setSearchQuery("");
                          setActiveSearchIndex(-1);
                          setSearchOpen(false);
                        }}
                        onMouseEnter={() =>
                          setActiveSearchIndex(
                            visibleSearchResults.findIndex((r) => r.href === m.href),
                          )
                        }
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${appMeta} ${
                          visibleSearchResults[activeSearchIndex]?.href === m.href
                            ? "bg-white/[0.07]"
                            : "hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="truncate text-foreground/90">
                          {renderHighlightedText(m.label, searchQuery)}
                          <span className="ml-1 text-muted">
                            ({renderHighlightedText(m.description, searchQuery)})
                          </span>
                          {m.maturity ? (
                            <span className="ml-1 rounded bg-white/[0.07] px-1 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted">
                              {maturityLabel(m.maturity)}
                            </span>
                          ) : null}
                          {!searchQuery.trim() && effectivePinnedHrefs.includes(m.href) ? (
                            <AppIcon name="pin" size={10} className="ml-1 inline text-accent/75" aria-hidden />
                          ) : null}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted">
                          {renderHighlightedText(m.href, searchQuery)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div
                  className={`mt-1 flex items-center justify-between border-t border-white/[0.08] px-2 py-1.5 text-muted ${appMeta}`}
                  aria-hidden
                >
                  <span>↑↓ Navigate</span>
                  <span>Enter Open</span>
                  <span>Esc Close</span>
                </div>
              </div>
            ) : searchOpen && searchQuery.trim() ? (
              <div className="absolute right-0 top-[calc(100%+0.4rem)] z-40 w-[min(22rem,80vw)] rounded-xl border border-white/[0.1] bg-[rgba(10,12,18,0.98)] p-3 shadow-[0_18px_48px_-22px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <p className={`text-foreground/90 ${appMeta}`}>No matches found.</p>
                <p className={`mt-1 text-muted ${appMeta}`}>
                  Try a shorter term like incident, policy, or settings.
                </p>
              </div>
            ) : null}
          </div>
          <label htmlFor="console-jump" className="sr-only">
            Jump to module
          </label>
          <select
            id="console-jump"
            key={`${pathname}-${jumpReset}`}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                router.push(v);
                setJumpReset((k) => k + 1);
              }
            }}
            className={`h-9 max-w-[11rem] cursor-pointer rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 font-medium text-foreground/90 outline-none ring-accent/25 focus:border-accent/40 focus:ring-2 sm:max-w-[14rem] ${appMeta}`}
          >
            <option value="">Jump to…</option>
            {CONSOLE_MODULES.map((m) => (
              <option key={m.href} value={m.href}>
                {m.label} · {maturityLabel(m.maturity)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
