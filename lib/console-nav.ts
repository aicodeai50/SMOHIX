import type { ConsoleModuleIconName } from "@/components/icons/AppIcon";

export type ConsoleModuleMaturity = "core" | "beta" | "internal" | "planned";

export type ConsoleNavGroupId =
  | "home"
  | "operations"
  | "knowledge"
  | "intelligence"
  | "manage";

/** Shared console navigation — hub + module shortcuts. */
export const CONSOLE_MODULES: readonly {
  href: string;
  label: string;
  description: string;
  icon: ConsoleModuleIconName;
  live: boolean;
  maturity: ConsoleModuleMaturity;
  group: ConsoleNavGroupId;
}[] = [
  {
    href: "/hub",
    label: "Hub",
    description: "Workspace home",
    icon: "layoutDashboard",
    live: true,
    maturity: "core",
    group: "home",
  },
  {
    href: "/overview",
    label: "Overview",
    description: "Command center",
    icon: "gauge",
    live: true,
    maturity: "core",
    group: "home",
  },
  {
    href: "/incidents",
    label: "Incidents",
    description: "Track & resolve",
    icon: "alertTriangle",
    live: true,
    maturity: "core",
    group: "operations",
  },
  {
    href: "/services",
    label: "Services",
    description: "Catalog & health",
    icon: "server",
    live: true,
    maturity: "core",
    group: "operations",
  },
  {
    href: "/automations",
    label: "Automations",
    description: "Playbooks",
    icon: "workflow",
    live: true,
    maturity: "core",
    group: "operations",
  },
  {
    href: "/approvals",
    label: "Approvals",
    description: "Human gates",
    icon: "shieldCheck",
    live: true,
    maturity: "core",
    group: "operations",
  },
  {
    href: "/runbooks",
    label: "Runbooks",
    description: "Procedures",
    icon: "bookOpen",
    live: true,
    maturity: "core",
    group: "knowledge",
  },
  {
    href: "/audit",
    label: "Audit",
    description: "Evidence log",
    icon: "scrollText",
    live: true,
    maturity: "core",
    group: "knowledge",
  },
  {
    href: "/governance/compliance",
    label: "Compliance",
    description: "Evidence mapping",
    icon: "scrollText",
    live: true,
    maturity: "beta",
    group: "knowledge",
  },
  {
    href: "/copilot",
    label: "Copilot",
    description: "AI triage",
    icon: "bot",
    live: true,
    maturity: "beta",
    group: "intelligence",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Workspace & account",
    icon: "settings",
    live: true,
    maturity: "core",
    group: "manage",
  },
] as const;

/** Sidebar / Jump-to group order and labels. */
export const CONSOLE_NAV_GROUPS: readonly {
  id: ConsoleNavGroupId;
  label: string;
}[] = [
  { id: "home", label: "Home" },
  { id: "operations", label: "Operations" },
  { id: "knowledge", label: "Knowledge & governance" },
  { id: "intelligence", label: "Intelligence" },
  { id: "manage", label: "Manage" },
] as const;

/** Manage area shortcuts that reuse existing Settings destinations. */
export const CONSOLE_MANAGE_LINKS: readonly {
  href: string;
  label: string;
  description: string;
  icon: ConsoleModuleIconName;
}[] = [
  {
    href: "/settings/connectors",
    label: "Integrations",
    description: "Connectors & monitoring",
    icon: "plug2",
  },
  {
    href: "/settings/api-keys",
    label: "API & developers",
    description: "Keys and API access",
    icon: "keyRound",
  },
  {
    href: "/developers",
    label: "Developer docs",
    description: "SDKs and guides",
    icon: "bookOpen",
  },
] as const;

/** Show badges only when they communicate maturity (never for stable/core). */
export function shouldShowModuleBadge(maturity: ConsoleModuleMaturity): boolean {
  return maturity === "beta" || maturity === "internal" || maturity === "planned";
}

export function moduleBadgeLabel(maturity: ConsoleModuleMaturity): string | null {
  if (maturity === "beta") return "Beta";
  if (maturity === "internal") return "Internal";
  if (maturity === "planned") return "Planned";
  return null;
}

export function groupModulesForNav(
  modules: readonly (typeof CONSOLE_MODULES)[number][],
): { id: ConsoleNavGroupId; label: string; modules: (typeof CONSOLE_MODULES)[number][] }[] {
  const byGroup = new Map<ConsoleNavGroupId, (typeof CONSOLE_MODULES)[number][]>();
  for (const mod of modules) {
    const list = byGroup.get(mod.group) ?? [];
    list.push(mod);
    byGroup.set(mod.group, list);
  }
  return CONSOLE_NAV_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    modules: byGroup.get(g.id) ?? [],
  })).filter((g) => g.modules.length > 0 || g.id === "manage" || g.id === "intelligence");
}
