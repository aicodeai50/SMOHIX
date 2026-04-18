const MODULE_LABEL: Record<string, string> = {
  overview: "Overview",
  copilot: "Copilot",
  incidents: "Incidents",
  automations: "Automations",
  runbooks: "Runbooks",
  approvals: "Approvals",
  audit: "Audit",
  settings: "Settings",
};

/**
 * Parent navigation for the console chrome: hub for top-level modules, module root
 * for nested routes (e.g. `/incidents/[id]` → `/incidents`).
 */
export function getConsoleBackLink(pathname: string): { href: string; label: string } | null {
  if (!pathname || pathname === "/hub") return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) {
    return { href: "/hub", label: "Platform" };
  }
  const root = parts[0]!;
  const label = MODULE_LABEL[root] ?? root.charAt(0).toUpperCase() + root.slice(1);
  return { href: `/${root}`, label };
}
