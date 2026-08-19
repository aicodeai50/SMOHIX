/**
 * Smohix platform map — nodes, edges, and product relationship graph.
 * Single source for interactive ecosystem UI and product detail pages.
 */

import type { AppIconName } from "@/components/icons/AppIcon";

export type ProductMaturity = "live" | "preview" | "prototype" | "coming-soon";

export type PlatformNodeId =
  | "smohix-run"
  | "platform"
  | "ai"
  | "projects"
  | "knowledge"
  | "agents"
  | "api"
  | "analytics"
  | "cloud"
  | "identity"
  | "developers";

export type PlatformNode = {
  id: PlatformNodeId;
  label: string;
  shortDescription: string;
  href: string;
  icon: AppIconName;
  /** Visual row in the platform map (0 = top). */
  tier: number;
  maturity: ProductMaturity;
  /** Adjacent nodes — highlighted together on hover/focus. */
  connections: readonly PlatformNodeId[];
};

export const PLATFORM_NODES: readonly PlatformNode[] = [
  {
    id: "smohix-run",
    label: "Smohix.run",
    shortDescription: "Official home and entry point for the ecosystem.",
    href: "/",
    icon: "layoutDashboard",
    tier: 0,
    maturity: "live",
    connections: ["platform"],
  },
  {
    id: "platform",
    label: "Smohix Platform",
    shortDescription: "Core console — incidents, automation, approvals, audit.",
    href: "/products/smohix-platform",
    icon: "layoutDashboard",
    tier: 1,
    maturity: "live",
    connections: ["smohix-run", "ai", "projects", "knowledge", "agents", "api", "identity"],
  },
  {
    id: "ai",
    label: "AI",
    shortDescription: "Copilot, reasoning proxy, and guided triage.",
    href: "/products/smohix-ai",
    icon: "bot",
    tier: 2,
    maturity: "live",
    connections: ["platform", "agents", "knowledge", "api"],
  },
  {
    id: "projects",
    label: "Projects",
    shortDescription: "Team and environment organization across the workspace.",
    href: "/products/projects",
    icon: "layoutDashboard",
    tier: 2,
    maturity: "coming-soon",
    connections: ["platform", "knowledge", "agents", "identity"],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    shortDescription: "Runbooks, evidence, and shared operational context.",
    href: "/products/knowledge",
    icon: "bookOpen",
    tier: 2,
    maturity: "coming-soon",
    connections: ["platform", "ai", "projects"],
  },
  {
    id: "agents",
    label: "Agents",
    shortDescription: "Guarded playbooks with dry-runs and human approval gates.",
    href: "/products/agents",
    icon: "workflow",
    tier: 3,
    maturity: "prototype",
    connections: ["ai", "platform", "api", "projects"],
  },
  {
    id: "api",
    label: "API",
    shortDescription: "Smohix Own API, ingest tokens, and webhooks.",
    href: "/products/smohix-own-api",
    icon: "server",
    tier: 3,
    maturity: "live",
    connections: ["platform", "ai", "agents", "developers", "cloud"],
  },
  {
    id: "analytics",
    label: "Analytics",
    shortDescription: "Command center metrics, SLO views, and operational signals.",
    href: "/products/analytics",
    icon: "gauge",
    tier: 3,
    maturity: "preview",
    connections: ["platform", "ai", "api"],
  },
  {
    id: "cloud",
    label: "Cloud",
    shortDescription: "Railway deployment, private networking, and service mesh.",
    href: "/technology",
    icon: "plug2",
    tier: 4,
    maturity: "live",
    connections: ["api", "platform", "identity"],
  },
  {
    id: "identity",
    label: "Identity",
    shortDescription: "Supabase auth, org RBAC, and API keys.",
    href: "/products/identity",
    icon: "shieldCheck",
    tier: 4,
    maturity: "live",
    connections: ["platform", "projects", "api", "cloud"],
  },
  {
    id: "developers",
    label: "Developers",
    shortDescription: "Docs, API catalog, and integration guides.",
    href: "/developers",
    icon: "keyRound",
    tier: 3,
    maturity: "live",
    connections: ["api", "platform"],
  },
] as const;

export const PLATFORM_NODE_MAP = new Map(
  PLATFORM_NODES.map((n) => [n.id, n]),
);

/** Normalized coordinates (0–100) for SVG platform map layout. */
export const PLATFORM_LAYOUT: Record<
  PlatformNodeId,
  { x: number; y: number }
> = {
  "smohix-run": { x: 50, y: 6 },
  platform: { x: 50, y: 20 },
  ai: { x: 18, y: 36 },
  projects: { x: 50, y: 36 },
  knowledge: { x: 82, y: 36 },
  agents: { x: 18, y: 52 },
  api: { x: 50, y: 52 },
  analytics: { x: 82, y: 52 },
  developers: { x: 50, y: 64 },
  cloud: { x: 50, y: 78 },
  identity: { x: 82, y: 78 },
};

/** Unique edges for SVG (deduped undirected). */
export function getPlatformEdges(): { from: PlatformNodeId; to: PlatformNodeId }[] {
  const seen = new Set<string>();
  const edges: { from: PlatformNodeId; to: PlatformNodeId }[] = [];
  for (const node of PLATFORM_NODES) {
    for (const conn of node.connections) {
      const key = [node.id, conn].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: node.id, to: conn });
    }
  }
  return edges;
}

export type ProductPageContent = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  maturity: ProductMaturity;
  nodeId?: PlatformNodeId;
  problem: string;
  solution: string;
  howItWorks: readonly string[];
  benefits: readonly string[];
  roadmap: readonly string[];
  uses: readonly { id: PlatformNodeId; label: string }[];
  worksWith: readonly { id: PlatformNodeId; label: string }[];
  integratesWith: readonly string[];
  relatedProducts: readonly { slug: string; name: string }[];
  developerApis: readonly { href: string; label: string }[];
  documentation: readonly { href: string; label: string }[];
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

const rel = (id: PlatformNodeId) => ({
  id,
  label: PLATFORM_NODE_MAP.get(id)?.label ?? id,
});

export const PRODUCT_PAGES: readonly ProductPageContent[] = [
  {
    id: "smohix-platform",
    slug: "smohix-platform",
    name: "Smohix Platform",
    tagline: "The operational command layer for incidents, automation, and evidence.",
    maturity: "live",
    nodeId: "platform",
    problem:
      "Teams scatter incidents, runbooks, approvals, and audit trails across disconnected tools — slowing response and weakening accountability.",
    solution:
      "Smohix Platform unifies incident command, guarded automation, service context, and audit export in one workspace at smohix.run.",
    howItWorks: [
      "Alerts and ingest open or enrich incidents with service context.",
      "Automations dry-run against robot backends before execution.",
      "High-risk changes route through human approval gates.",
      "Every action writes to an append-only audit timeline.",
    ],
    benefits: [
      "Single console for platform, SRE, SOC, and GRC workflows",
      "Human-in-the-loop automation by default",
      "Compliance-oriented evidence modules (beta)",
      "PayPal billing and org-scoped settings",
    ],
    roadmap: [
      "Deeper cross-module analytics in the command center",
      "Tighter agent orchestration from the same console",
      "Expanded vertical solution packs",
    ],
    uses: [rel("smohix-run"), rel("cloud")],
    worksWith: [rel("ai"), rel("agents"), rel("api"), rel("identity"), rel("knowledge")],
    integratesWith: ["Supabase", "PayPal", "Slack approvals", "Alert ingest webhooks"],
    relatedProducts: [
      { slug: "smohix-ai", name: "Smohix AI" },
      { slug: "smohix-own-api", name: "Smohix Own API" },
      { slug: "agents", name: "Agents" },
    ],
    developerApis: [
      { href: "/docs/api", label: "API catalog" },
      { href: "/api/robot/health", label: "Robot proxy" },
      { href: "/api/reasoning/health", label: "Reasoning proxy" },
    ],
    documentation: [
      { href: "/docs", label: "Documentation" },
      { href: "/platform", label: "Platform overview" },
      { href: "/hub", label: "Open console" },
    ],
    primaryCta: { href: "/auth/sign-in?next=/hub", label: "Open console" },
    secondaryCta: { href: "/architecture", label: "View architecture" },
  },
  {
    id: "smohix-ai",
    slug: "smohix-ai",
    name: "Smohix AI",
    tagline: "Copilot and reasoning integrated into accountable operations.",
    maturity: "live",
    nodeId: "ai",
    problem:
      "Generic chat tools sit outside your incident and approval workflow — answers lack context and cannot safely trigger production changes.",
    solution:
      "Smohix AI routes Copilot through same-origin APIs to OpenAI or your reasoning backend, grounded in workspace context and guardrails.",
    howItWorks: [
      "Open the flagship workspace at ai.smohix.run.",
      "Console Copilot uses server-side routes — keys stay off the client.",
      "Incident-aware threads when signed in to Platform.",
      "Guided offline replies when no model is configured for your environment.",
    ],
    benefits: [
      "Flagship AI workspace separate from marketing pages",
      "Works alongside approvals and audit in Platform",
      "Multi-model intelligence without exposing routing in public copy",
    ],
    roadmap: [
      "Richer agent handoff from AI threads",
      "Knowledge grounding when Knowledge product matures",
    ],
    uses: [rel("platform"), rel("api")],
    worksWith: [rel("agents"), rel("knowledge"), rel("analytics")],
    integratesWith: ["Smohix Platform", "Smohix identity", "Developer APIs"],
    relatedProducts: [
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "agents", name: "Agents" },
    ],
    developerApis: [
      { href: "/docs/api", label: "Copilot API routes" },
      { href: "/api/reasoning/health", label: "Reasoning proxy health" },
    ],
    documentation: [
      { href: "/docs", label: "Docs" },
      { href: "/developers", label: "Developers" },
    ],
    primaryCta: { href: "/auth/sign-in?next=/copilot", label: "Try Copilot" },
    secondaryCta: { href: "/technology", label: "AI layer" },
  },
  {
    id: "smohix-own-api",
    slug: "smohix-own-api",
    name: "Smohix Own API",
    tagline: "Centralized API surface for billing events and ecosystem integration.",
    maturity: "live",
    nodeId: "api",
    problem:
      "Billing, ingest, and automation callers need stable, documented endpoints — not ad-hoc URLs per service.",
    solution:
      "Smohix Own API (documented at /docs/api) exposes cataloged routes; optional REACT_APP_SMOHIX_OWN_API forwards billing events to your centralized service.",
    howItWorks: [
      "Public catalog lists authenticated and webhook routes.",
      "API keys and alert ingest tokens scoped per workspace.",
      "Same-origin proxies reach private Railway backends.",
      "PayPal webhooks sync subscriptions and balance server-side.",
    ],
    benefits: [
      "One reference for integrators and internal teams",
      "Private network URLs never shipped to the browser",
      "Idempotent webhook delivery tracking",
    ],
    roadmap: [
      "Expanded Own API event types for cross-product billing",
      "SDK documentation alongside the catalog",
    ],
    uses: [rel("platform"), rel("cloud")],
    worksWith: [rel("ai"), rel("agents"), rel("developers"), rel("identity")],
    integratesWith: ["PayPal", "Supabase service role", "SMOHIX-OWN-API (optional)"],
    relatedProducts: [
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "identity", name: "Identity" },
    ],
    developerApis: [
      { href: "/docs/api", label: "Full API catalog" },
      { href: "/settings/api-keys", label: "API keys" },
    ],
    documentation: [
      { href: "/docs/api", label: "API reference" },
      { href: "/developers", label: "Developer hub" },
    ],
    primaryCta: { href: "/docs/api", label: "Browse API catalog" },
    secondaryCta: { href: "/auth/sign-in?next=/settings/api-keys", label: "Create API key" },
  },
  {
    id: "agents",
    slug: "agents",
    name: "Agents",
    tagline: "Composable automation with dry-runs, approvals, and evidence.",
    maturity: "prototype",
    nodeId: "agents",
    problem:
      "Unsupervised automation in production creates blast-radius risk without dry-runs or human gates.",
    solution:
      "Agents extend Platform automations with playbook execution against robot backends, policy guardrails, and audit receipts.",
    howItWorks: [
      "Define playbooks in the Automations console.",
      "Dry-run records results before live execution (paid plans).",
      "Robot backend reached via server proxy when configured.",
      "Remediation flows capture steps and blocked reasons.",
    ],
    benefits: [
      "Prototype execution path exists today in Platform",
      "Clear simulated vs connector modes",
      "Tied to incidents and approval notes",
    ],
    roadmap: [
      "First-class agent registry and scheduling",
      "Healthcare memory context injection",
      "Multi-step agent graphs",
    ],
    uses: [rel("ai"), rel("platform"), rel("api")],
    worksWith: [rel("projects"), rel("knowledge")],
    integratesWith: ["Robot backend", "Slack approvals", "Audit log"],
    relatedProducts: [
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "smohix-ai", name: "Smohix AI" },
    ],
    developerApis: [
      { href: "/api/automations/dry-run", label: "Dry-run API" },
      { href: "/api/robot/health", label: "Robot health" },
    ],
    documentation: [
      { href: "/docs", label: "Docs" },
      { href: "/auth/sign-in?next=/automations", label: "Automations console" },
    ],
    primaryCta: { href: "/auth/sign-in?next=/automations", label: "Open automations" },
  },
  {
    id: "projects",
    slug: "projects",
    name: "Projects",
    tagline: "Organize teams, environments, and product lines in one workspace.",
    maturity: "coming-soon",
    nodeId: "projects",
    problem:
      "Large organizations need clear boundaries between teams and environments without spinning up separate tenants for every group.",
    solution:
      "Projects will layer organization structure on Platform — sharing Identity and API surfaces.",
    howItWorks: [
      "Org RBAC exists today via members settings (foundation).",
      "Dedicated project scopes and pinning planned.",
      "Cross-project audit views planned.",
    ],
    benefits: [
      "Builds on live org and role model",
      "Same Identity and billing spine",
    ],
    roadmap: [
      "Project-scoped incidents and automations",
      "Hub personalization per project",
      "Cross-project analytics",
    ],
    uses: [rel("platform"), rel("identity")],
    worksWith: [rel("knowledge"), rel("agents"), rel("analytics")],
    integratesWith: ["Supabase org members", "Platform hub"],
    relatedProducts: [
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "identity", name: "Identity" },
    ],
    developerApis: [{ href: "/docs/api", label: "Org APIs (expanding)" }],
    documentation: [{ href: "/settings/members", label: "Members & roles" }],
    primaryCta: { href: "/contact", label: "Talk to us" },
  },
  {
    id: "knowledge",
    slug: "knowledge",
    name: "Knowledge",
    tagline: "Operational knowledge linked to incidents, runbooks, and compliance.",
    maturity: "coming-soon",
    nodeId: "knowledge",
    problem:
      "Runbooks and evidence live in wikis and tickets disconnected from live incidents and automation state.",
    solution:
      "Knowledge will connect runbooks, compliance mappings, and Copilot context inside Platform.",
    howItWorks: [
      "Runbooks module exists today in Platform.",
      "Compliance evidence mapping in beta.",
      "Unified knowledge graph planned.",
    ],
    benefits: [
      "Foundation modules shipping in Platform now",
      "Clear path to AI-grounded answers",
    ],
    roadmap: [
      "Search across runbooks and incidents",
      "Knowledge-aware Copilot threads",
      "Assessor export linkage",
    ],
    uses: [rel("platform"), rel("ai")],
    worksWith: [rel("projects")],
    integratesWith: ["Runbooks", "Compliance hub", "Copilot"],
    relatedProducts: [
      { slug: "smohix-platform", name: "Smohix Platform" },
    ],
    developerApis: [{ href: "/docs/api", label: "Governance APIs" }],
    documentation: [{ href: "/auth/sign-in?next=/runbooks", label: "Runbooks" }],
    primaryCta: { href: "/auth/sign-in?next=/runbooks", label: "Browse runbooks" },
  },
  {
    id: "analytics",
    slug: "analytics",
    name: "Analytics",
    tagline: "Operational signals from the command center and service catalog.",
    maturity: "preview",
    nodeId: "analytics",
    problem:
      "Leaders need a single view of incident load, approvals backlog, and connector health — without another BI tool.",
    solution:
      "Analytics surfaces live in Overview and hub dashboards today; a dedicated analytics product layer is in preview.",
    howItWorks: [
      "Overview command center aggregates incidents and connectors.",
      "Hub stats show open incidents and plan status.",
      "Error budget and SLO views per service where configured.",
    ],
    benefits: [
      "Uses live workspace data when signed in",
      "No separate silo — same Platform identity",
    ],
    roadmap: [
      "Dedicated analytics module route",
      "Exportable executive summaries",
      "Cross-product usage metrics",
    ],
    uses: [rel("platform"), rel("api")],
    worksWith: [rel("ai"), rel("projects")],
    integratesWith: ["Overview module", "Services SLO", "Hub dashboard"],
    relatedProducts: [
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "smohix-ai", name: "Smohix AI" },
    ],
    developerApis: [{ href: "/api/overview/error-budget-summary", label: "SLO summary API" }],
    documentation: [{ href: "/auth/sign-in?next=/overview", label: "Overview console" }],
    primaryCta: { href: "/auth/sign-in?next=/overview", label: "Open overview" },
  },
  {
    id: "identity",
    slug: "identity",
    name: "Identity",
    tagline: "Authentication, org RBAC, and API keys for the ecosystem.",
    maturity: "live",
    nodeId: "identity",
    problem:
      "Every product needs consistent sign-in, roles, and programmatic access — not one-off auth per feature.",
    solution:
      "Identity spans Supabase auth, organization members, delegated approvers, and Smohix API keys.",
    howItWorks: [
      "Supabase sessions protect console routes.",
      "Org roles filter modules (including auditor workspace).",
      "API keys and ingest tokens managed in Settings.",
    ],
    benefits: [
      "Single sign-in for all Platform modules",
      "Service role used only server-side for webhooks",
    ],
    roadmap: [
      "Cross-product SSO documentation",
      "Fine-grained product scopes on API keys",
    ],
    uses: [rel("platform"), rel("cloud")],
    worksWith: [rel("api"), rel("projects")],
    integratesWith: ["Supabase Auth", "PayPal billing user linkage"],
    relatedProducts: [
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "smohix-own-api", name: "Smohix Own API" },
    ],
    developerApis: [{ href: "/settings/api-keys", label: "API keys" }],
    documentation: [
      { href: "/settings/members", label: "Members" },
      { href: "/security", label: "Security" },
    ],
    primaryCta: { href: "/auth/sign-in", label: "Sign in" },
  },
  {
    id: "smohix-assistant",
    slug: "smohix-assistant",
    name: "Smohix Assistant",
    tagline: "Personal intelligent workspace for productivity — distinct from team AI chat.",
    maturity: "live",
    problem:
      "Team AI chat is not built for individual focus, planning, and personal knowledge work.",
    solution:
      "Smohix Assistant at assistant.smohix.run is a dedicated productivity workspace within the Smohix ecosystem.",
    howItWorks: [
      "Sign in with Smohix identity — same company, separate workspace.",
      "Personal workflows for planning, drafting, and daily work.",
      "Optional linkage to organization Platform settings when enabled.",
    ],
    benefits: [
      "Clear differentiation from Smohix AI team intelligence",
      "Personal productivity focus",
      "Ecosystem-native identity and access",
    ],
    roadmap: ["Calendar and task integrations", "Org-controlled Platform linkage"],
    uses: [rel("identity"), rel("ai")],
    worksWith: [rel("platform"), rel("developers")],
    integratesWith: ["Smohix identity", "Smohix AI (optional)"],
    relatedProducts: [
      { slug: "smohix-ai", name: "Smohix AI" },
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "private-ai", name: "Smohix PRI" },
    ],
    developerApis: [{ href: "/docs/api", label: "API catalog" }],
    documentation: [
      { href: "/developers", label: "Developers" },
      { href: "/docs", label: "Documentation" },
    ],
    primaryCta: { href: "https://assistant.smohix.run", label: "Open Assistant" },
    secondaryCta: { href: "/products", label: "All products" },
  },
  {
    id: "private-ai",
    slug: "private-ai",
    name: "Smohix PRI",
    tagline: "Private AI workspace for organizations that need greater control.",
    maturity: "live",
    problem:
      "Security-sensitive teams need AI without giving up deployment control or data boundaries.",
    solution:
      "Smohix PRI at pri.smohix.run provides a controlled workspace for private deployment and organization-scoped access.",
    howItWorks: [
      "Dedicated workspace within the Smohix ecosystem.",
      "Organization-controlled access patterns.",
      "Complements flagship Smohix AI — not a universal replacement.",
    ],
    benefits: [
      "Privacy and security-first positioning",
      "Enterprise deployment conversations",
      "Shared identity with other workspaces",
    ],
    roadmap: ["Enterprise deployment guides", "Platform governance integration"],
    uses: [rel("identity"), rel("ai")],
    worksWith: [rel("platform"), rel("developers")],
    integratesWith: ["Smohix identity", "Enterprise governance (beta)"],
    relatedProducts: [
      { slug: "smohix-ai", name: "Smohix AI" },
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "identity", name: "Identity" },
    ],
    developerApis: [{ href: "/docs/api", label: "API catalog" }],
    documentation: [
      { href: "/enterprise", label: "Enterprise" },
      { href: "/trust", label: "Trust center" },
    ],
    primaryCta: { href: "https://pri.smohix.run", label: "Open Smohix PRI" },
    secondaryCta: { href: "/contact?inquiry=enterprise", label: "Contact sales" },
  },
  {
    id: "smohix-log",
    slug: "smohix-log",
    name: "Smohix Log",
    tagline: "Operational workspace for administrators — not a consumer product.",
    maturity: "live",
    problem:
      "Administrators need operational visibility without mixing consumer product surfaces.",
    solution:
      "Smohix Log at log.smohix.run is an administrator workspace for operational review within the ecosystem.",
    howItWorks: [
      "Restricted to authorized administrators.",
      "Complements Platform audit and governance modules.",
      "Same Smohix identity model as other workspaces.",
    ],
    benefits: [
      "Administrator-focused — not marketed as consumer AI",
      "Operational review within one ecosystem",
      "Clear separation from flagship products",
    ],
    roadmap: ["Expanded export controls", "Cross-workspace operational views"],
    uses: [rel("platform"), rel("identity")],
    worksWith: [rel("developers")],
    integratesWith: ["Smohix Platform audit modules"],
    relatedProducts: [
      { slug: "smohix-platform", name: "Smohix Platform" },
      { slug: "identity", name: "Identity" },
    ],
    developerApis: [{ href: "/docs/api", label: "API catalog" }],
    documentation: [{ href: "/security", label: "Security" }],
    primaryCta: { href: "https://log.smohix.run", label: "Open Log workspace" },
    secondaryCta: { href: "/contact?inquiry=enterprise", label: "Request access" },
  },
] as const;

export function getProductBySlug(slug: string): ProductPageContent | undefined {
  return PRODUCT_PAGES.find((p) => p.slug === slug);
}

export function getAllProductSlugs(): string[] {
  return PRODUCT_PAGES.map((p) => p.slug);
}

export type PlatformStatusItem = {
  id: string;
  label: string;
  status: "operational" | "preview" | "coming-soon";
  href: string;
};

export const PLATFORM_STATUS: readonly PlatformStatusItem[] = [
  { id: "ai", label: "Smohix AI", status: "operational", href: "/products/smohix-ai" },
  { id: "platform", label: "Platform", status: "operational", href: "/products/smohix-platform" },
  { id: "assistant", label: "Assistant", status: "operational", href: "/products/smohix-assistant" },
  { id: "private-ai", label: "Smohix PRI", status: "operational", href: "/products/private-ai" },
  { id: "api", label: "Smohix Own API", status: "operational", href: "/products/smohix-own-api" },
  { id: "docs", label: "Documentation", status: "operational", href: "/docs" },
  { id: "developers", label: "Developers", status: "operational", href: "/developers" },
  { id: "log", label: "Smohix Log", status: "operational", href: "/products/smohix-log" },
  { id: "identity", label: "Smohix Identity", status: "operational", href: "/products/identity" },
  { id: "agents", label: "Agents", status: "preview", href: "/products/agents" },
  { id: "analytics", label: "Analytics", status: "preview", href: "/products/analytics" },
] as const;

export const ARCHITECTURE_LAYERS = [
  {
    id: "users",
    label: "Users",
    detail: "Operators, developers, approvers, auditors",
    href: "/solutions",
  },
  {
    id: "frontend",
    label: "Frontend",
    detail: "Next.js at smohix.run — marketing, console, same-origin API routes",
    href: "/technology",
  },
  {
    id: "own-api",
    label: "Smohix Own API",
    detail: "Documented gateway surface — product UIs call Own API / same-origin routes; private backends stay server-side",
    href: "/products/smohix-own-api",
  },
  {
    id: "platform",
    label: "Platform",
    detail: "Incidents, automations, approvals, audit, Copilot modules",
    href: "/products/smohix-platform",
  },
  {
    id: "gateway",
    label: "AI Gateway",
    detail: "Copilot route, reasoning proxy, optional OpenAI",
    href: "/products/smohix-ai",
  },
  {
    id: "providers",
    label: "Providers",
    detail: "Configured AI and automation backends (server-side only)",
    href: "/architecture",
  },
  {
    id: "storage",
    label: "Storage",
    detail: "Supabase Postgres, auth, RLS-scoped workspace data",
    href: "/technology",
  },
  {
    id: "infra",
    label: "Infrastructure",
    detail: "Deployed services with private networking — topology not published",
    href: "/technology",
  },
] as const;

export const TECHNOLOGY_STACK = [
  {
    category: "Frontend",
    items: ["Next.js 16 App Router", "React 19", "Tailwind CSS v4", "Inter + JetBrains Mono"],
  },
  {
    category: "Backend",
    items: [
      "Next.js API routes (same-origin)",
      "Supabase (auth + Postgres)",
      "Private proxies to SH & Robot backends",
    ],
  },
  {
    category: "Infrastructure",
    items: ["Railway deployment", "Private service networking", "Health checks at /api/health"],
  },
  {
    category: "AI layer",
    items: [
      "OpenAI (optional server key)",
      "Reasoning backend via REACT_APP_SH_BACKEND_API",
      "Copilot SSE streaming",
    ],
  },
  {
    category: "Developer stack",
    items: [
      "Smohix API catalog",
      "Smohix API keys",
      "Alert ingest tokens",
      "PayPal webhooks",
    ],
  },
  {
    category: "Security",
    items: [
      "Supabase RLS",
      "Server-only secrets",
      "Webhook signature verification",
      "Rate limiting on proxies",
    ],
  },
  {
    category: "Deployment",
    items: ["Railway NIXPACKS build", "Canonical domain smohix.run", "Migrations via Supabase SQL"],
  },
] as const;

export function maturityLabel(m: ProductMaturity): string {
  switch (m) {
    case "live":
      return "Live";
    case "preview":
      return "Preview";
    case "prototype":
      return "Prototype";
    case "coming-soon":
      return "Coming soon";
  }
}

export function statusIndicator(
  status: PlatformStatusItem["status"],
): { emoji: string; label: string; className: string } {
  switch (status) {
    case "operational":
      return { emoji: "🟢", label: "Operational", className: "text-success" };
    case "preview":
      return { emoji: "🟡", label: "Preview", className: "text-warning" };
    case "coming-soon":
      return { emoji: "⚪", label: "Coming soon", className: "text-muted" };
  }
}
