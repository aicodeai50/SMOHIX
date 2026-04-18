const MODULE_ROOT: Record<string, string> = {
  hub: "Platform",
  overview: "Overview",
  copilot: "Copilot",
  incidents: "Incidents",
  services: "Services",
  automations: "Automations",
  runbooks: "Runbooks",
  approvals: "Approvals",
  audit: "Audit",
  settings: "Settings",
};

const SETTINGS_CHILD: Record<string, string> = {
  billing: "Billing",
  "api-keys": "API keys",
  connectors: "Connectors",
};

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function humanSegment(parts: string[], index: number): string {
  const seg = parts[index]!;
  const root = parts[0]!;

  if (root === "incidents" && index === 1) {
    if (seg === "new") return "New incident";
    return "Incident";
  }
  if (root === "runbooks" && index === 1) {
    return titleCaseSlug(seg);
  }
  if (root === "settings" && index === 1) {
    return SETTINGS_CHILD[seg] ?? titleCaseSlug(seg);
  }

  return MODULE_ROOT[seg] ?? titleCaseSlug(seg);
}

/**
 * Breadcrumb trail for console routes (first crumb is always Platform home).
 */
export function getConsoleBreadcrumbs(pathname: string): { href: string; label: string }[] {
  const raw = pathname.replace(/\/$/, "") || "/";
  const parts = raw.split("/").filter(Boolean);

  if (parts.length === 0) {
    return [{ href: "/hub", label: "Platform" }];
  }
  if (parts[0] === "hub" && parts.length === 1) {
    return [{ href: "/hub", label: "Platform" }];
  }

  const out: { href: string; label: string }[] = [{ href: "/hub", label: "Platform" }];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc += "/" + parts[i]!;
    out.push({ href: acc, label: humanSegment(parts, i) });
  }
  return out;
}
