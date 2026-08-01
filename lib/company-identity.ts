/**
 * Zentro Technologies — company positioning for zentro.run marketing.
 * Truthful copy only; no invented customers, metrics, or certifications.
 */

export const COMPANY_NAME = "Zentro Technologies" as const;

export const COMPANY_MISSION =
  "Build AI infrastructure that helps teams operate production systems with clarity, accountability, and trust." as const;

export const COMPANY_VISION =
  "A unified Zentro ecosystem where developers, operators, and organizations run AI-assisted workflows without sacrificing control or evidence." as const;

export const COMPANY_LONG_TERM_GOALS = [
  "Unify product experiences under one coherent platform architecture",
  "Ship AI capabilities with human-in-the-loop guardrails by default",
  "Support regulated and high-stakes environments with audit-ready evidence",
  "Open developer surfaces that integrate with existing tools and backends",
] as const;

export const COMPANY_HERO_HEADLINE =
  "The AI technology company for accountable operations" as const;

export const COMPANY_HERO_SUBHEADING =
  "Zentro Technologies builds unified AI platforms, APIs, and agent infrastructure — so teams can move fast in production without losing control, privacy, or proof." as const;

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
};

export const ECOSYSTEM_PRODUCTS: readonly EcosystemProduct[] = [
  {
    id: "zentro-platform",
    name: "Zentro Platform",
    description: "Incident command, guarded automation, approvals, and audit evidence in one workspace.",
    href: "/products/zentro-platform",
    status: "live",
    icon: "layoutDashboard",
  },
  {
    id: "zentro-ai",
    name: "Zentro AI",
    description: "AI-assisted triage, Copilot, and reasoning integrated into the operations console.",
    href: "/products/zentro-ai",
    status: "live",
    icon: "bot",
  },
  {
    id: "zentro-own-api",
    name: "Zentro Own API",
    description: "Centralized API surface for billing, integrations, and ecosystem services.",
    href: "/products/zentro-own-api",
    status: "live",
    icon: "server",
  },
  {
    id: "identity",
    name: "Identity",
    description: "Supabase auth, org RBAC, and API keys shared across the ecosystem.",
    href: "/products/identity",
    status: "live",
    icon: "shieldCheck",
  },
  {
    id: "agents",
    name: "Agents",
    description: "Composable agents with approvals, dry-runs, and execution guardrails.",
    href: "/products/agents",
    status: "prototype",
    icon: "workflow",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Command center metrics, SLO views, and operational signals.",
    href: "/products/analytics",
    status: "preview",
    icon: "gauge",
  },
  {
    id: "memory-pendant",
    name: "Memory Pendant",
    description: "Persistent memory layer for agents and long-running workflows.",
    href: "/products/memory-pendant",
    status: "coming-soon",
    icon: "telescope",
  },
  {
    id: "projects",
    name: "Projects",
    description: "Organize work across teams, environments, and product lines.",
    href: "/products/projects",
    status: "coming-soon",
    icon: "layoutDashboard",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    description: "Shared knowledge bases connected to incidents, runbooks, and compliance.",
    href: "/products/knowledge",
    status: "coming-soon",
    icon: "bookOpen",
  },
  {
    id: "developers",
    name: "Developers",
    description: "Documentation, API reference, and integration guides for building on Zentro.",
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
    description: "APIs, webhooks, and automation hooks designed for builders shipping on Zentro.",
    href: "/developers",
  },
  {
    id: "businesses",
    title: "Businesses",
    description: "Operational visibility and guarded automation for growing product teams.",
    href: "/enterprise",
  },
  {
    id: "healthcare",
    title: "Healthcare",
    description: "Compliance-oriented workflows with evidence trails for regulated environments.",
    href: "/solutions/healthcare",
  },
  {
    id: "enterprise",
    title: "Enterprise",
    description: "RBAC, residency controls, and procurement-ready governance surfaces.",
    href: "/enterprise",
  },
  {
    id: "government",
    title: "Government",
    description: "Accountability-first architecture for public-sector and regulated deployments.",
    href: "/solutions/government",
  },
  {
    id: "education",
    title: "Education",
    description: "Safe sandboxes and clear audit paths for research and institutional use.",
    href: "/solutions/education",
  },
] as const;

export const WHY_CHOOSE_ZENTRO = [
  {
    title: "Unified platform",
    description: "Incidents, automation, approvals, and evidence share one console — not a patchwork of tools.",
  },
  {
    title: "AI-first",
    description: "Copilot and reasoning backends integrate with human gates instead of bypassing them.",
  },
  {
    title: "Privacy by design",
    description: "Server-side integrations and configurable data boundaries; no fabricated compliance claims.",
  },
  {
    title: "Developer friendly",
    description: "Open API catalog, ingest tokens, and same-origin proxies for backend services.",
  },
  {
    title: "Enterprise ready",
    description: "Org RBAC, deployment profiles, and governance modules for serious rollouts.",
  },
  {
    title: "Scalable architecture",
    description: "Modular services on Railway with private networking between frontend and backends.",
  },
  {
    title: "Modern stack",
    description: "Next.js, Supabase, and typed APIs — maintained in the open on GitHub.",
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
      "Zentro Platform console — incidents, automations, approvals, audit",
      "PayPal billing and workspace settings",
      "Copilot with OpenAI and reasoning backend integration",
      "Compliance and governance modules (beta)",
    ],
  },
  {
    phase: "next",
    label: "Next",
    items: [
      "Expanded agent workflows with stronger guardrails",
      "Memory Pendant private preview",
      "Deeper developer SDK documentation",
      "Solutions pages for vertical use cases",
    ],
  },
  {
    phase: "future",
    label: "Future",
    items: [
      "Knowledge graph across projects and incidents",
      "Cross-product identity and billing via Zentro Own API",
      "Broader ecosystem integrations",
    ],
  },
] as const;

export const COMING_SOON_PRODUCTS = ECOSYSTEM_PRODUCTS.filter(
  (p) => p.status === "coming-soon",
);

export function getComingSoonProduct(slug: string): EcosystemProduct | undefined {
  return COMING_SOON_PRODUCTS.find((p) => p.id === slug);
}

export const COMING_SOON_SOLUTIONS = [
  {
    slug: "healthcare",
    title: "Healthcare",
    description:
      "Purpose-built workflows for healthcare teams that need audit trails and controlled automation.",
  },
  {
    slug: "government",
    title: "Government",
    description:
      "Accountability-first deployment patterns for public-sector and regulated environments.",
  },
  {
    slug: "education",
    title: "Education",
    description:
      "Institutional sandboxes with clear evidence paths for research and teaching.",
  },
] as const;

export function getComingSoonSolution(slug: string) {
  return COMING_SOON_SOLUTIONS.find((s) => s.slug === slug);
}
