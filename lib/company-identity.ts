/**
 * Zentro Technologies — company positioning for zentro.run marketing.
 * Truthful copy only; no invented customers, metrics, or certifications.
 */

export const COMPANY_NAME = "Zentro Technologies" as const;

export const COMPANY_ORIGIN =
  "Founded with Norwegian engineering roots — building for clarity, privacy, and long-term product quality." as const;

export const COMPANY_MISSION =
  "Build intelligent software, AI products, developer platforms, and technology solutions that help people and organizations work smarter." as const;

export const COMPANY_VISION =
  "One Zentro ecosystem where public headquarters, authenticated workspaces, and developer surfaces feel like rooms in the same digital company — never disconnected microsites." as const;

export const COMPANY_TECHNOLOGY_PHILOSOPHY =
  "AI-native products with human oversight, open developer standards, privacy by design, and honest maturity labels on everything we ship." as const;

export const COMPANY_LONG_TERM_GOALS = [
  "Unify flagship workspaces under one coherent Zentro identity",
  "Ship AI capabilities with guardrails and accountable operations by default",
  "Support regulated and high-stakes environments with audit-ready evidence",
  "Open developer surfaces — APIs, documentation, and SDKs — that integrators can trust",
] as const;

export const COMPANY_HERO_HEADLINE =
  "Intelligent software for organizations that need to move fast — with control" as const;

export const COMPANY_HERO_SUBHEADING =
  "Zentro Technologies builds AI products, developer platforms, APIs, and enterprise solutions — one ecosystem at zentro.run, with workspaces for AI, platform operations, assistant productivity, and private deployment." as const;

export type EcosystemProduct = {
  id: string;
  name: string;
  description: string;
  href: string;
  status: "live" | "preview" | "prototype" | "coming-soon";
  icon:
    | "bot"
    | "layoutDashboard"
    | "server"
    | "telescope"
    | "workflow"
    | "bookOpen"
    | "keyRound"
    | "plug2"
    | "gauge"
    | "shieldCheck";
  flagship?: boolean;
};

/** Homepage and JSON-LD ecosystem list — Memory Pendant is not a flagship entry. */
export const ECOSYSTEM_PRODUCTS: readonly EcosystemProduct[] = [
  {
    id: "zentro-ai",
    name: "Zentro AI",
    description: "Flagship AI workspace for multi-model intelligence, reasoning, and coding assistance.",
    href: "/products/zentro-ai",
    status: "live",
    icon: "bot",
    flagship: true,
  },
  {
    id: "zentro-platform",
    name: "Zentro Platform",
    description: "Operational workspace — incidents, automation, organizations, and administration.",
    href: "/products/zentro-platform",
    status: "live",
    icon: "layoutDashboard",
    flagship: true,
  },
  {
    id: "zentro-assistant",
    name: "Zentro Assistant",
    description: "Personal intelligent workspace for productivity — separate from team AI chat.",
    href: "/products/zentro-assistant",
    status: "live",
    icon: "bot",
    flagship: true,
  },
  {
    id: "private-ai",
    name: "Private AI",
    description: "Private AI workspace for organizations needing greater control and deployment options.",
    href: "/products/private-ai",
    status: "live",
    icon: "shieldCheck",
    flagship: true,
  },
  {
    id: "zentro-own-api",
    name: "Zentro Own API",
    description: "Developer APIs, authentication, webhooks, and ecosystem integrations.",
    href: "/products/zentro-own-api",
    status: "live",
    icon: "server",
  },
  {
    id: "identity",
    name: "Identity",
    description: "Authentication, organization roles, and API keys across workspaces.",
    href: "/products/identity",
    status: "live",
    icon: "shieldCheck",
  },
  {
    id: "agents",
    name: "Agents",
    description: "Guarded automation playbooks with dry-runs and human approval gates.",
    href: "/products/agents",
    status: "prototype",
    icon: "workflow",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Operational metrics, SLO views, and command-center signals.",
    href: "/products/analytics",
    status: "preview",
    icon: "gauge",
  },
  {
    id: "projects",
    name: "Projects",
    description: "Collaboration workspaces and scoped environments.",
    href: "/products/projects",
    status: "coming-soon",
    icon: "layoutDashboard",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    description: "Secure knowledge retrieval and organization memory.",
    href: "/products/knowledge",
    status: "coming-soon",
    icon: "bookOpen",
  },
  {
    id: "developers",
    name: "Developers",
    description: "API catalog, SDK overview, documentation, and integration guides.",
    href: "/developers",
    status: "live",
    icon: "keyRound",
  },
] as const;

export type AudienceSegment = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export const AUDIENCE_SEGMENTS: readonly AudienceSegment[] = [
  {
    id: "developers",
    title: "Developers",
    description: "APIs, SDKs, streaming, authentication, and documentation for builders.",
    href: "/developers",
  },
  {
    id: "business-automation",
    title: "Business Automation",
    description: "Guarded workflows and operational visibility for product teams.",
    href: "/solutions/business-automation",
  },
  {
    id: "enterprise-ai",
    title: "Enterprise AI",
    description: "AI programs with governance, access control, and procurement-ready surfaces.",
    href: "/solutions/enterprise-ai",
  },
  {
    id: "healthcare",
    title: "Healthcare",
    description: "Compliance-oriented workflows and caregiver technology projects.",
    href: "/solutions/healthcare",
  },
  {
    id: "government",
    title: "Government",
    description: "Accountability-first architecture for public-sector deployments.",
    href: "/solutions/government",
  },
  {
    id: "education",
    title: "Education",
    description: "Institutional sandboxes with clear audit paths.",
    href: "/solutions/education",
  },
] as const;

export const WHY_CHOOSE_ZENTRO = [
  {
    title: "One ecosystem",
    description: "Headquarters at zentro.run and authenticated workspaces — same company, same identity.",
  },
  {
    title: "AI products",
    description: "Flagship AI, assistant productivity, and private deployment options — not a single chat widget.",
  },
  {
    title: "Privacy by design",
    description: "Configurable data boundaries and server-side integrations — no fabricated compliance claims.",
  },
  {
    title: "Developer first",
    description: "API catalog, documentation, SDK roadmap, and honest status for integrators.",
  },
  {
    title: "Enterprise ready",
    description: "Organization roles, governance modules, and procurement-oriented trust documentation.",
  },
  {
    title: "Scalable architecture",
    description: "Modular products that grow from individual builders to enterprise organizations.",
  },
  {
    title: "Honest maturity",
    description: "Live, preview, planned, and in-development labels — no pretense that roadmap items are GA.",
  },
] as const;

export type RoadmapPhase = {
  phase: "now" | "next" | "future";
  label: string;
  items: readonly string[];
};

export const COMPANY_ROADMAP: readonly RoadmapPhase[] = [
  {
    phase: "now",
    label: "Now",
    items: [
      "Zentro AI, Platform, Assistant, and Private AI workspaces",
      "Developer hub, API catalog, and documentation",
      "Operational console — incidents, automations, approvals, audit",
    ],
  },
  {
    phase: "next",
    label: "Next",
    items: [
      "Expanded agent workflows with stronger guardrails",
      "Knowledge and analytics product layers",
      "Deeper SDK and streaming documentation",
    ],
  },
  {
    phase: "future",
    label: "Future",
    items: [
      "Industry solutions and healthcare caregiver technology maturation",
      "Cross-workspace identity and billing unification",
      "Broader enterprise automation and integrations",
    ],
  },
] as const;

export const COMING_SOON_PRODUCTS = ECOSYSTEM_PRODUCTS.filter(
  (p) => p.status === "coming-soon",
);

export function getComingSoonProduct(slug: string): EcosystemProduct | undefined {
  return COMING_SOON_PRODUCTS.find((p) => p.id === slug);
}

/** @deprecated Use lib/solutions-content.ts — kept for static param compatibility during migration. */
export const COMING_SOON_SOLUTIONS = [
  {
    slug: "healthcare",
    title: "Healthcare",
    description: "Compliance-oriented workflows and caregiver technology projects.",
  },
  {
    slug: "government",
    title: "Government",
    description: "Accountability-first deployment patterns for public-sector teams.",
  },
  {
    slug: "education",
    title: "Education",
    description: "Institutional sandboxes with clear evidence paths.",
  },
] as const;

export function getComingSoonSolution(slug: string) {
  return COMING_SOON_SOLUTIONS.find((s) => s.slug === slug);
}

export const FLAGSHIP_ECOSYSTEM_PRODUCTS = ECOSYSTEM_PRODUCTS.filter((p) => p.flagship);
