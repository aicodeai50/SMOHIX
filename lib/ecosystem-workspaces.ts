/**
 * Zentro ecosystem workspaces — public subdomains are rooms in one headquarters,
 * not independent companies.
 */

export const ZENTRO_WORKSPACE_URLS = {
  headquarters: "https://zentro.run",
  platform: "https://platform.zentro.run",
  ai: "https://ai.zentro.run",
  assistant: "https://assistant.zentro.run",
  privateAi: "https://pri.zentro.run",
  log: "https://log.zentro.run",
} as const;

export type WorkspaceId = keyof typeof ZENTRO_WORKSPACE_URLS;

/** Primary nav — simple top-level IA. */
export const PRIMARY_SITE_NAV = [
  { href: "/products", label: "Products" },
  { href: "/solutions", label: "Solutions" },
  { href: "/developers", label: "Developers" },
  { href: "/professional-services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/company", label: "Company" },
] as const;

/** Flagship products — homepage and products hub lead with these. */
export const FLAGSHIP_PRODUCT_IDS = [
  "zentro-ai",
  "zentro-platform",
  "zentro-assistant",
  "private-ai",
] as const;

export type FlagshipProductId = (typeof FLAGSHIP_PRODUCT_IDS)[number];

export const FLAGSHIP_PRODUCTS = [
  {
    id: "zentro-ai",
    name: "Zentro AI",
    description: "Flagship AI workspace for multi-model intelligence, reasoning, and coding assistance.",
    href: "/products/zentro-ai",
    workspaceUrl: ZENTRO_WORKSPACE_URLS.ai,
    status: "live" as const,
  },
  {
    id: "zentro-platform",
    name: "Zentro Platform",
    description: "Operational workspace — organizations, projects, knowledge, agents, and administration.",
    href: "/products/zentro-platform",
    workspaceUrl: ZENTRO_WORKSPACE_URLS.platform,
    status: "live" as const,
  },
  {
    id: "zentro-assistant",
    name: "Zentro Assistant",
    description: "Personal intelligent workspace for productivity — distinct from team AI chat.",
    href: "/products/zentro-assistant",
    workspaceUrl: ZENTRO_WORKSPACE_URLS.assistant,
    status: "live" as const,
  },
  {
    id: "private-ai",
    name: "Private AI",
    description: "Private AI workspace for organizations that need greater control and deployment options.",
    href: "/products/private-ai",
    workspaceUrl: ZENTRO_WORKSPACE_URLS.privateAi,
    status: "live" as const,
  },
] as const;

export const DEVELOPER_SURFACE = [
  { href: "/docs/api", label: "API" },
  { href: "/developers", label: "SDKs" },
  { href: "/docs", label: "Documentation" },
  { href: "/status", label: "Status" },
  { href: "/next", label: "Roadmap" },
] as const;

export const SOLUTION_AREAS = [
  {
    slug: "business-automation",
    title: "Business Automation",
    description: "Guarded automation and operational workflows for growing product teams.",
    href: "/solutions/business-automation",
  },
  {
    slug: "enterprise-ai",
    title: "Enterprise AI",
    description: "AI programs with governance, access control, and accountable operations.",
    href: "/solutions/enterprise-ai",
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    description: "Compliance-oriented workflows and caregiver technology — including Memory Pendant.",
    href: "/solutions/healthcare",
  },
  {
    slug: "education",
    title: "Education",
    description: "Institutional sandboxes with clear audit paths for research and teaching.",
    href: "/solutions/education",
  },
  {
    slug: "government",
    title: "Government",
    description: "Accountability-first architecture for public-sector deployments.",
    href: "/solutions/government",
  },
] as const;

export const SERVICE_OFFERINGS = [
  { id: "ai-integration", title: "AI Integration" },
  { id: "platform-engineering", title: "Platform Engineering" },
  { id: "ai-consulting", title: "AI Consulting" },
  { id: "custom-software", title: "Custom Software" },
] as const;

/** Hostnames allowed in public product URLs and health probes. */
export const ECOSYSTEM_PUBLIC_HOSTS = [
  "zentro.run",
  "www.zentro.run",
  "platform.zentro.run",
  "ai.zentro.run",
  "assistant.zentro.run",
  "pri.zentro.run",
  "log.zentro.run",
  "localhost",
  "127.0.0.1",
] as const;

export function isFlagshipProduct(id: string): id is FlagshipProductId {
  return (FLAGSHIP_PRODUCT_IDS as readonly string[]).includes(id);
}
