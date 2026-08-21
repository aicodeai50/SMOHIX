const GROUP_BY_ROOT: Record<string, string> = {
  hub: "Home",
  overview: "Home",
  incidents: "Operations",
  services: "Operations",
  automations: "Operations",
  approvals: "Operations",
  runbooks: "Knowledge & governance",
  audit: "Knowledge & governance",
  governance: "Knowledge & governance",
  copilot: "Intelligence",
  settings: "Manage",
};

const MODULE_ROOT: Record<string, string> = {
  hub: "Hub",
  vision: "Vision",
  overview: "Overview",
  copilot: "Copilot",
  incidents: "Incidents",
  services: "Services",
  automations: "Automations",
  runbooks: "Runbooks",
  approvals: "Approvals",
  audit: "Audit",
  settings: "Settings",
  governance: "Governance",
};

const SETTINGS_CHILD: Record<string, string> = {
  billing: "Billing",
  "api-keys": "API keys",
  connectors: "Integrations",
  members: "Members & access",
  deployment: "Deployment",
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
  if (root === "governance" && index === 1) {
    return titleCaseSlug(seg);
  }

  return MODULE_ROOT[seg] ?? titleCaseSlug(seg);
}

/**
 * Breadcrumb trail for console routes.
 * Pattern: Group / Module [/ …]
 */
export function getConsoleBreadcrumbs(pathname: string): { href: string; label: string }[] {
  const raw = pathname.replace(/\/$/, "") || "/";
  const parts = raw.split("/").filter(Boolean);

  if (parts.length === 0 || (parts[0] === "hub" && parts.length === 1)) {
    return [{ href: "/hub", label: "Home" }, { href: "/hub", label: "Hub" }];
  }

  const root = parts[0]!;
  const groupLabel = GROUP_BY_ROOT[root] ?? "Platform";
  const groupHref =
    root === "hub" || root === "overview"
      ? "/hub"
      : root === "settings"
        ? "/settings"
        : `/${root}`;

  const out: { href: string; label: string }[] = [{ href: groupHref, label: groupLabel }];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    acc += "/" + parts[i]!;
    out.push({ href: acc, label: humanSegment(parts, i) });
  }
  return out;
}
