/**
 * Executive technology page content — customer/investor-facing only.
 * No env vars, internal service names, repository paths, or implementation secrets.
 */

export type TechnologyFlowStep = {
  label: string;
  description: string;
  href?: string;
};

export const PLATFORM_ARCHITECTURE_FLOW: readonly TechnologyFlowStep[] = [
  {
    label: "Users",
    description: "Operators, developers, security teams, and organizational leaders",
  },
  {
    label: "Smohix.run",
    description: "Unified public experience — marketing, products, and console entry",
    href: "/",
  },
  {
    label: "Smohix Platform",
    description: "Core workspace for incidents, automation, approvals, and audit",
    href: "/products/smohix-platform",
  },
  {
    label: "AI Gateway",
    description: "Secure routing for multi-model intelligence and streaming inference",
    href: "/products/smohix-ai",
  },
  {
    label: "Models & Intelligence",
    description: "Reasoning, coding assistance, retrieval, and future agent orchestration",
  },
  {
    label: "Products",
    description: "Platform, AI, API, Knowledge, Projects, and ecosystem capabilities",
    href: "/products",
  },
  {
    label: "Organizations",
    description: "Teams, permissions, billing, and enterprise administration",
    href: "/enterprise",
  },
] as const;

export const CORE_PLATFORM_CARDS = [
  {
    title: "Platform",
    description:
      "Unified platform for users, organizations, products, identity, billing, and administration.",
    href: "/products/smohix-platform",
  },
  {
    title: "Artificial Intelligence",
    description:
      "Multi-model intelligence with routing, reasoning, streaming, coding assistance, and future agent orchestration.",
    href: "/products/smohix-ai",
  },
  {
    title: "API Platform",
    description: "Developer APIs, authentication, SDKs, webhooks, and integrations.",
    href: "/products/smohix-own-api",
  },
  {
    title: "Knowledge",
    description: "Secure knowledge retrieval and organization memory.",
    href: "/products/knowledge",
  },
  {
    title: "Projects",
    description: "Workspace for collaboration and AI-assisted development.",
    href: "/products/projects",
  },
  {
    title: "Security",
    description:
      "Enterprise authentication, permissions, encryption, auditing, and privacy-first design.",
    href: "/security",
  },
] as const;

export const TECHNOLOGY_STACK_CATEGORIES = [
  {
    category: "Frontend",
    items: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  },
  {
    category: "Backend",
    items: ["Node.js", "REST APIs", "PostgreSQL", "Authentication"],
  },
  {
    category: "Artificial Intelligence",
    items: [
      "Multi-provider AI routing",
      "Streaming inference",
      "Retrieval",
      "Agent framework",
    ],
  },
  {
    category: "Infrastructure",
    items: ["Cloud deployment", "Monitoring", "Secure networking", "Automatic scaling"],
  },
  {
    category: "Developer Experience",
    items: ["SDKs", "REST APIs", "Documentation", "CLI (planned)"],
  },
] as const;

export const ENGINEERING_PRINCIPLES = [
  {
    title: "Privacy by Design",
    description: "Data boundaries and consent-aware experiences built into the platform from day one.",
  },
  {
    title: "Security First",
    description: "Authentication, authorization, and encryption are foundational — not add-ons.",
  },
  {
    title: "Open Standards",
    description: "REST APIs, documented interfaces, and interoperable patterns integrators expect.",
  },
  {
    title: "AI Native",
    description: "Intelligence woven through products with human oversight and accountable workflows.",
  },
  {
    title: "Developer First",
    description: "Clear documentation, stable APIs, and tools that respect production environments.",
  },
  {
    title: "Reliable Infrastructure",
    description: "Monitoring, health visibility, and resilient deployment for serious operations.",
  },
  {
    title: "Scalable Architecture",
    description: "Modular capabilities that grow from individual builders to enterprise organizations.",
  },
  {
    title: "Responsible AI",
    description: "Guardrails, transparency about maturity, and human-in-the-loop by default.",
  },
] as const;

export type EcosystemNode = {
  id: string;
  label: string;
  description: string;
  href?: string;
};

/** Vertical connection map — executive labels only. */
export const ECOSYSTEM_CONNECTION_FLOW: readonly EcosystemNode[] = [
  {
    id: "smohix-run",
    label: "Smohix.run",
    description: "Official home and product entry point",
    href: "/",
  },
  {
    id: "platform",
    label: "Platform",
    description: "Operational command and workspace",
    href: "/products/smohix-platform",
  },
  {
    id: "identity",
    label: "Identity",
    description: "Authentication, roles, and access",
    href: "/products/identity",
  },
  {
    id: "ai",
    label: "AI",
    description: "Copilot, reasoning, and intelligent assistance",
    href: "/products/smohix-ai",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    description: "Runbooks, memory, and organizational context",
    href: "/products/knowledge",
  },
  {
    id: "projects",
    label: "Projects",
    description: "Collaboration and scoped workspaces",
    href: "/products/projects",
  },
  {
    id: "developers",
    label: "Developers",
    description: "APIs, docs, and integration surfaces",
    href: "/developers",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    description: "Governance, procurement, and scale",
    href: "/enterprise",
  },
  {
    id: "products",
    label: "Products",
    description: "Full ecosystem catalog with honest maturity",
    href: "/products",
  },
] as const;

export type GrowthPhase = "today" | "next" | "future";

export type GrowthItem = {
  label: string;
  maturity: "live" | "preview" | "prototype" | "coming-soon";
};

export const BUILT_FOR_GROWTH = [
  {
    phase: "today" as const,
    label: "Today",
    items: [
      { label: "Platform", maturity: "live" as const },
      { label: "AI", maturity: "live" as const },
      { label: "API", maturity: "live" as const },
    ],
  },
  {
    phase: "next" as const,
    label: "Next",
    items: [
      { label: "Agents", maturity: "prototype" as const },
      { label: "Knowledge", maturity: "coming-soon" as const },
      { label: "Analytics", maturity: "preview" as const },
    ],
  },
  {
    phase: "future" as const,
    label: "Future",
    items: [
      { label: "Robotics", maturity: "coming-soon" as const },
      { label: "Healthcare", maturity: "coming-soon" as const },
      { label: "Smart devices", maturity: "coming-soon" as const },
      { label: "Enterprise automation", maturity: "coming-soon" as const },
    ],
  },
] as const;

export const SECURITY_PILLARS = [
  {
    title: "Identity",
    description: "Organization-scoped sign-in, roles, and programmatic access controls.",
  },
  {
    title: "Encryption",
    description: "Encrypted transport and protected credentials — secrets never exposed client-side.",
  },
  {
    title: "Access Control",
    description: "Role-based permissions and delegated approval workflows for high-risk actions.",
  },
  {
    title: "Audit Logs",
    description: "Append-only operational history for review, export, and accountability.",
  },
  {
    title: "Monitoring",
    description: "Health visibility and operational signals for platform reliability.",
  },
  {
    title: "Responsible AI",
    description: "Human gates, dry-runs, and honest maturity labels on AI capabilities.",
  },
] as const;

export const DEVELOPER_ECOSYSTEM_LINKS = [
  { href: "/developers", label: "Developers", description: "Hub for builders integrating with Smohix" },
  { href: "/docs/api", label: "API", description: "Catalog of public HTTP interfaces" },
  { href: "/docs", label: "Documentation", description: "Product, trust, and onboarding guides" },
  { href: "/developers", label: "SDK", description: "Client libraries and patterns (expanding)" },
  { href: "/status", label: "Status", description: "Runtime service checks when configured" },
] as const;

export const GROWTH_PHASE_STYLES: Record<GrowthPhase, string> = {
  today: "border-accent/35 bg-accent/[0.06]",
  next: "border-primary-muted/35 bg-primary-dim",
  future: "border-white/[0.1] bg-white/[0.02]",
};
