import { CONSOLE_MODULES } from "@/lib/console-nav";
import {
  AUDITOR_WORKSPACE_HOME,
  filterConsoleModulesForRole,
  isAuditorWorkspaceRole,
} from "@/lib/org/auditor-workspace";
import type { OrgRole } from "@/lib/org/roles";

export const HUB_PERSONALIZATION_VERSION = 1;

export const DEFAULT_HUB_QUICK_LINK_HREFS = [
  "/overview",
  "/incidents",
  "/services",
  "/copilot",
] as const;

/** Optional richer blurbs for default hub cards. */
export const HUB_QUICK_LINK_BLURBS: Record<string, string> = {
  "/overview": "Incidents snapshot, connectors, and readiness.",
  "/incidents": "Open, resolve, and drill into timelines.",
  "/services": "Catalog systems and wire alert → incident ingest (paid).",
  "/copilot": "Triage with structured next steps.",
};

export const MAX_HUB_QUICK_LINKS = 8;
export const MAX_PINNED_NAV_MODULES = 6;

export type HubQuickLink = {
  href: string;
  title: string;
  blurb: string;
  pinned: boolean;
};

export type HubPersonalizationPrefs = {
  quickLinkHrefs: string[];
  pinnedHrefs: string[];
};

export type HubPersonalizationState = {
  version: typeof HUB_PERSONALIZATION_VERSION;
  quickLinks: HubQuickLink[];
  pinnedHrefs: string[];
  availableHrefs: string[];
  customized: boolean;
};

export function hubPersonalizationDefaults(): HubPersonalizationPrefs {
  return {
    quickLinkHrefs: [...DEFAULT_HUB_QUICK_LINK_HREFS],
    pinnedHrefs: [],
  };
}

export function allowedHubModuleHrefs(role: OrgRole | null | undefined): string[] {
  const allowed = filterConsoleModulesForRole(CONSOLE_MODULES, role)
    .map((m) => m.href)
    .filter((href) => href !== "/hub");
  if (isAuditorWorkspaceRole(role) && !allowed.includes(AUDITOR_WORKSPACE_HOME)) {
    return [AUDITOR_WORKSPACE_HOME, ...allowed];
  }
  return allowed;
}

function dedupeHrefs(hrefs: unknown, allowed: Set<string>, max: number): string[] {
  if (!Array.isArray(hrefs)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of hrefs) {
    if (typeof raw !== "string") continue;
    const href = raw.trim();
    if (!href || !allowed.has(href) || seen.has(href)) continue;
    seen.add(href);
    out.push(href);
    if (out.length >= max) break;
  }
  return out;
}

export function sanitizeHubPersonalizationPrefs(
  raw: Partial<HubPersonalizationPrefs> | null | undefined,
  role: OrgRole | null | undefined,
): HubPersonalizationPrefs {
  const allowed = new Set(allowedHubModuleHrefs(role));
  const defaults = hubPersonalizationDefaults();
  const fallbackQuickLinks = isAuditorWorkspaceRole(role)
    ? allowedHubModuleHrefs(role).slice(0, MAX_HUB_QUICK_LINKS)
    : defaults.quickLinkHrefs;
  const quickLinkHrefs = dedupeHrefs(raw?.quickLinkHrefs, allowed, MAX_HUB_QUICK_LINKS);
  const pinnedHrefs = dedupeHrefs(raw?.pinnedHrefs, allowed, MAX_PINNED_NAV_MODULES);

  return {
    quickLinkHrefs: quickLinkHrefs.length > 0 ? quickLinkHrefs : fallbackQuickLinks,
    pinnedHrefs,
  };
}

export function resolveHubQuickLinks(
  prefs: HubPersonalizationPrefs,
  role: OrgRole | null | undefined,
): HubQuickLink[] {
  const modules = filterConsoleModulesForRole(CONSOLE_MODULES, role);
  const byHref = new Map(modules.map((m) => [m.href, m]));
  if (isAuditorWorkspaceRole(role) && !byHref.has(AUDITOR_WORKSPACE_HOME)) {
    byHref.set(AUDITOR_WORKSPACE_HOME, {
      href: AUDITOR_WORKSPACE_HOME,
      label: "SOC 2 Type II",
      description: "Auditor report mode",
      icon: "scrollText",
      live: true,
      maturity: "beta",
      group: "knowledge",
    });
  }
  const pinnedSet = new Set(prefs.pinnedHrefs);

  return prefs.quickLinkHrefs
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
}

export function buildHubPersonalizationState(
  raw: Partial<HubPersonalizationPrefs> | null | undefined,
  role: OrgRole | null | undefined,
): HubPersonalizationState {
  const prefs = sanitizeHubPersonalizationPrefs(raw, role);
  const defaults = hubPersonalizationDefaults();
  const customized =
    JSON.stringify(prefs.quickLinkHrefs) !== JSON.stringify(defaults.quickLinkHrefs) ||
    prefs.pinnedHrefs.length > 0;

  return {
    version: HUB_PERSONALIZATION_VERSION,
    quickLinks: resolveHubQuickLinks(prefs, role),
    pinnedHrefs: prefs.pinnedHrefs,
    availableHrefs: allowedHubModuleHrefs(role),
    customized,
  };
}

export function reorderNavModulesForPins<T extends { href: string }>(
  modules: readonly T[],
  pinnedHrefs: readonly string[],
): T[] {
  if (pinnedHrefs.length === 0) return [...modules];
  const pinnedSet = new Set(pinnedHrefs);
  const pinned = pinnedHrefs
    .map((href) => modules.find((m) => m.href === href))
    .filter((m): m is T => m !== undefined);
  const rest = modules.filter((m) => !pinnedSet.has(m.href));
  return [...pinned, ...rest];
}

export function moveHref(hrefs: string[], href: string, direction: "up" | "down"): string[] {
  const index = hrefs.indexOf(href);
  if (index < 0) return hrefs;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= hrefs.length) return hrefs;
  const next = [...hrefs];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export function mergeIdleJumpModules<T extends { href: string; label: string; description: string }>(
  modules: readonly T[],
  pinnedHrefs: readonly string[],
  recentHrefs: readonly string[],
  max = 8,
) {
  const pinnedSet = new Set(pinnedHrefs);
  const byHref = new Map(modules.map((m) => [m.href, m]));
  const pinned = pinnedHrefs
    .map((href) => byHref.get(href))
    .filter((m): m is T => m !== undefined);
  const recents = recentHrefs
    .filter((href) => !pinnedSet.has(href))
    .map((href) => byHref.get(href))
    .filter((m): m is T => m !== undefined);
  return [...pinned, ...recents].slice(0, max);
}

export function togglePinnedHref(pinnedHrefs: string[], href: string): string[] {
  if (pinnedHrefs.includes(href)) {
    return pinnedHrefs.filter((item) => item !== href);
  }
  return [...pinnedHrefs, href].slice(-MAX_PINNED_NAV_MODULES);
}
