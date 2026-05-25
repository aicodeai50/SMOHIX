"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import {
  resetHubPersonalizationAction,
  updateHubPersonalizationAction,
} from "@/app/(app)/hub/personalization-actions";
import { AppIcon } from "@/components/icons/AppIcon";
import {
  HUB_QUICK_LINK_BLURBS,
  MAX_HUB_QUICK_LINKS,
  MAX_PINNED_NAV_MODULES,
  sanitizeHubPersonalizationPrefs,
  type HubQuickLink,
} from "@/lib/console/hub-personalization";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";

const LOCAL_STORAGE_KEY = "shynvo.hub.personalization";

type StoredPrefs = {
  quickLinkHrefs: string[];
  pinnedHrefs: string[];
};

type ModuleOption = {
  href: string;
  label: string;
  description: string;
};

export function HubQuickLinksPanel({
  quickLinks: initialQuickLinks,
  pinnedHrefs: initialPinnedHrefs,
  availableModules,
  canPersistServer,
  customized: initialCustomized,
}: {
  quickLinks: HubQuickLink[];
  pinnedHrefs: string[];
  availableModules: ModuleOption[];
  canPersistServer: boolean;
  customized: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editMode, setEditMode] = useState(false);
  const [quickLinks, setQuickLinks] = useState(initialQuickLinks);
  const [pinnedHrefs, setPinnedHrefs] = useState(initialPinnedHrefs);
  const [customized, setCustomized] = useState(initialCustomized);
  const [error, setError] = useState<string | null>(null);
  const [localHydrated, setLocalHydrated] = useState(canPersistServer);

  useEffect(() => {
    setQuickLinks(initialQuickLinks);
    setPinnedHrefs(initialPinnedHrefs);
    setCustomized(initialCustomized);
  }, [initialCustomized, initialPinnedHrefs, initialQuickLinks]);

  useEffect(() => {
    if (canPersistServer || localHydrated) return;
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      setLocalHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as StoredPrefs;
      const prefs = sanitizeHubPersonalizationPrefs(parsed, null);
      const byHref = new Map(availableModules.map((m) => [m.href, m]));
      const pinnedSet = new Set(prefs.pinnedHrefs);
      const links = prefs.quickLinkHrefs
        .map((href) => {
          const mod = byHref.get(href);
          if (!mod) return null;
          return {
            href,
            title: mod.label,
            blurb: HUB_QUICK_LINK_BLURBS[href] ?? mod.description,
            pinned: pinnedSet.has(href),
          };
        })
        .filter((link): link is HubQuickLink => link !== null);
      if (links.length > 0) {
        setQuickLinks(links);
        setPinnedHrefs(prefs.pinnedHrefs);
        setCustomized(true);
      }
    } catch {
      // Ignore malformed local payloads.
    }
    setLocalHydrated(true);
  }, [availableModules, canPersistServer, localHydrated]);

  const persist = useCallback(
    (nextQuickHrefs: string[], nextPinned: string[]) => {
      setError(null);
      startTransition(async () => {
        if (canPersistServer) {
          const result = await updateHubPersonalizationAction({
            quickLinkHrefs: nextQuickHrefs,
            pinnedHrefs: nextPinned,
          });
          if (!result.ok) {
            setError(result.reason);
            return;
          }
          router.refresh();
          return;
        }

        window.localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({ quickLinkHrefs: nextQuickHrefs, pinnedHrefs: nextPinned }),
        );
      });
    },
    [canPersistServer, router],
  );

  const applyPrefs = useCallback(
    (nextQuickHrefs: string[], nextPinned: string[]) => {
      const byHref = new Map(availableModules.map((m) => [m.href, m]));
      const pinnedSet = new Set(nextPinned);
      const nextLinks: HubQuickLink[] = nextQuickHrefs
        .map((href) => {
          const mod = byHref.get(href);
          if (!mod) return null;
          return {
            href,
            title: mod.label,
            blurb: HUB_QUICK_LINK_BLURBS[href] ?? mod.description,
            pinned: pinnedSet.has(href),
          };
        })
        .filter((link): link is HubQuickLink => link !== null);

      setQuickLinks(nextLinks);
      setPinnedHrefs(nextPinned);
      setCustomized(true);
      persist(nextQuickHrefs, nextPinned);
    },
    [availableModules, persist],
  );

  const move = (href: string, direction: "up" | "down") => {
    const hrefs = quickLinks.map((link) => link.href);
    const index = hrefs.indexOf(href);
    if (index < 0) return;
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= hrefs.length) return;
    [hrefs[index], hrefs[target]] = [hrefs[target]!, hrefs[index]!];
    applyPrefs(hrefs, pinnedHrefs);
  };

  const remove = (href: string) => {
    if (quickLinks.length <= 1) return;
    const hrefs = quickLinks.map((link) => link.href).filter((item) => item !== href);
    const nextPinned = pinnedHrefs.filter((item) => item !== href);
    applyPrefs(hrefs, nextPinned);
  };

  const togglePin = (href: string) => {
    const nextPinned = pinnedHrefs.includes(href)
      ? pinnedHrefs.filter((item) => item !== href)
      : [...pinnedHrefs, href].slice(-MAX_PINNED_NAV_MODULES);
    applyPrefs(
      quickLinks.map((link) => link.href),
      nextPinned,
    );
  };

  const addModule = (href: string) => {
    if (!href || quickLinks.some((link) => link.href === href)) return;
    if (quickLinks.length >= MAX_HUB_QUICK_LINKS) return;
    applyPrefs([...quickLinks.map((link) => link.href), href], pinnedHrefs);
  };

  const reset = () => {
    setError(null);
    startTransition(async () => {
      if (canPersistServer) {
        const result = await resetHubPersonalizationAction();
        if (!result.ok) {
          setError(result.reason);
          return;
        }
      } else {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      setEditMode(false);
      router.refresh();
    });
  };

  const unusedModules = availableModules.filter(
    (mod) => !quickLinks.some((link) => link.href === mod.href),
  );

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={appPanelTitle}>Quick links</h2>
          <p className={`mt-1 ${appBody} text-muted`}>
            {customized
              ? "Your pinned modules and link order — also prioritized in the left nav rail when signed in."
              : "Start with the essentials — customize pins and order per user."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {customized ? (
            <button
              type="button"
              disabled={pending}
              onClick={reset}
              className={`rounded-lg border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 font-semibold text-muted transition-colors hover:border-accent/35 hover:text-foreground disabled:opacity-60 ${appMeta}`}
            >
              Reset defaults
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditMode((open) => !open)}
            className={`rounded-lg border border-accent/35 bg-accent/10 px-3 py-1.5 font-semibold text-accent transition-colors hover:bg-accent/15 disabled:opacity-60 ${appMeta}`}
          >
            {editMode ? "Done" : "Customize"}
          </button>
        </div>
      </div>

      {error ? (
        <p className={`mb-3 rounded-xl border border-red-400/35 bg-red-400/10 px-3 py-2 text-red-100 ${appMeta}`}>
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item, index) => (
          <div key={item.href} className="relative">
            <Link
              href={item.href}
              className={`shynvo-glass group flex h-full flex-col rounded-2xl p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_0_40px_-14px_rgba(94,225,255,0.2)] ${
                editMode ? "pointer-events-none pr-12" : ""
              }`}
            >
              <h3 className={`${appPanelTitle} text-foreground group-hover:text-accent`}>{item.title}</h3>
              <p className={`mt-2 flex-1 ${appBody} text-muted`}>{item.blurb}</p>
              <span className={`mt-4 font-semibold text-accent/85 ${appMeta}`}>Open →</span>
            </Link>
            {editMode ? (
              <div className="absolute right-2 top-2 flex flex-col gap-1">
                <button
                  type="button"
                  title={item.pinned ? "Unpin from nav rail" : "Pin to nav rail"}
                  disabled={pending}
                  onClick={() => togglePin(item.href)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-background/90 transition-colors ${
                    item.pinned
                      ? "border-accent/45 text-accent"
                      : "border-white/[0.12] text-muted hover:border-accent/35 hover:text-accent"
                  }`}
                >
                  <AppIcon name="pin" size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  title="Move up"
                  disabled={pending || index === 0}
                  onClick={() => move(item.href, "up")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.12] bg-background/90 text-muted transition-colors hover:border-accent/35 hover:text-accent disabled:opacity-40"
                >
                  <AppIcon name="chevronUp" size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  title="Move down"
                  disabled={pending || index === quickLinks.length - 1}
                  onClick={() => move(item.href, "down")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.12] bg-background/90 text-muted transition-colors hover:border-accent/35 hover:text-accent disabled:opacity-40"
                >
                  <AppIcon name="chevronDown" size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  title="Remove"
                  disabled={pending || quickLinks.length <= 1}
                  onClick={() => remove(item.href)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.12] bg-background/90 text-muted transition-colors hover:border-red-400/45 hover:text-red-200 disabled:opacity-40"
                >
                  <AppIcon name="close" size={14} aria-hidden />
                </button>
              </div>
            ) : item.pinned ? (
              <span
                className="absolute right-3 top-3 rounded-md border border-accent/35 bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent"
                title="Pinned in nav rail"
              >
                Pinned
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {editMode && unusedModules.length > 0 && quickLinks.length < MAX_HUB_QUICK_LINKS ? (
        <div className={`mt-4 flex flex-wrap items-center gap-2 ${appMeta}`}>
          <label htmlFor="hub-add-module" className="font-semibold text-muted">
            Add module
          </label>
          <select
            id="hub-add-module"
            defaultValue=""
            disabled={pending}
            onChange={(event) => {
              const href = event.target.value;
              if (!href) return;
              addModule(href);
              event.target.value = "";
            }}
            className="min-w-[12rem] rounded-lg border border-white/[0.12] bg-background px-3 py-2 text-foreground"
          >
            <option value="">Choose…</option>
            {unusedModules.map((mod) => (
              <option key={mod.href} value={mod.href}>
                {mod.label}
              </option>
            ))}
          </select>
          <span className="text-muted">
            Up to {MAX_HUB_QUICK_LINKS} quick links · {MAX_PINNED_NAV_MODULES} nav pins
          </span>
        </div>
      ) : null}
    </section>
  );
}