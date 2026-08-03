/**
 * Single source of truth for Zentro Technologies public products.
 * URLs and maturity are configured here — not inferred from marketing copy.
 */

import { getSiteUrl } from "@/lib/site";
import { ECOSYSTEM_PUBLIC_HOSTS } from "@/lib/ecosystem-workspaces";

export type RegistryMaturity = "live" | "preview" | "prototype" | "internal" | "planned";

export type ProductActionKind =
  | "open_product"
  | "read_docs"
  | "view_health"
  | "sign_in"
  | "join_pilot"
  | "view_changelog"
  | "contact"
  | "product_page";

export type ProductAction = {
  kind: ProductActionKind;
  label: string;
  href: string;
  external?: boolean;
};

export type ProductRegistryEntry = {
  id: string;
  name: string;
  publicName: string;
  description: string;
  maturity: RegistryMaturity;
  repository: string;
  productPagePath: string;
  /** Primary public product URL when one exists (HTTPS, allowlisted). */
  productUrl?: string;
  docsUrl?: string;
  /** Same-origin path or allowlisted external health probe path. */
  healthCheck?: { host: "zentro.run" | "ai.zentro.run"; path: string };
  availableActions: readonly ProductAction[];
  capabilities: readonly string[];
  limitations: readonly string[];
  dependencies: readonly string[];
  pilotAvailable: boolean;
  lastVerifiedAt: string;
};

const SITE = () => getSiteUrl().replace(/\/$/, "");
const AI_PUBLIC = process.env.ZENTRO_AI_PUBLIC_URL?.trim() || "https://ai.zentro.run";

export const ZENTRO_AI_PUBLIC_URL = AI_PUBLIC;

export const PRODUCT_REGISTRY: readonly ProductRegistryEntry[] = [
  {
    id: "zentro-platform",
    name: "Zentro Platform",
    publicName: "Zentro Platform",
    description: "Operational command layer — incidents, automation, approvals, and audit.",
    maturity: "live",
    repository: "github.com/aicodeai50/ZENTRO (this repo)",
    productPagePath: "/products/zentro-platform",
    productUrl: `${SITE()}/auth/sign-in?next=/hub`,
    docsUrl: `${SITE()}/docs`,
    healthCheck: { host: "zentro.run", path: "/api/health" },
    availableActions: [
      { kind: "sign_in", label: "Open console", href: "/auth/sign-in?next=/hub" },
      { kind: "read_docs", label: "Documentation", href: "/docs" },
      { kind: "product_page", label: "Product overview", href: "/products/zentro-platform" },
    ],
    capabilities: [
      "Incidents, automations, approvals, audit console",
      "Org settings, billing, connectors",
      "Compliance modules (beta)",
    ],
    limitations: ["Requires Supabase auth for console routes"],
    dependencies: ["Supabase Auth", "Optional reasoning and robot backends"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "zentro-ai",
    name: "Zentro AI",
    publicName: "Zentro AI",
    description: "Copilot and reasoning — standalone product and console integration.",
    maturity: "live",
    repository: "Zentro AI backend (separate repository — not modified here)",
    productPagePath: "/products/zentro-ai",
    productUrl: AI_PUBLIC,
    docsUrl: `${SITE()}/docs/api`,
    healthCheck: { host: "ai.zentro.run", path: "/" },
    availableActions: [
      { kind: "open_product", label: "Open Zentro AI", href: AI_PUBLIC, external: true },
      { kind: "sign_in", label: "Copilot in console", href: "/auth/sign-in?next=/copilot" },
      { kind: "read_docs", label: "Copilot API routes", href: "/docs/api" },
      { kind: "product_page", label: "Product overview", href: "/products/zentro-ai" },
    ],
    capabilities: [
      "Standalone app at ai.zentro.run",
      "Console Copilot via /api/copilot/chat (server-side keys)",
      "Optional reasoning backend proxy",
    ],
    limitations: [
      "Model capabilities depend on your deployment configuration",
      "Console Copilot requires a signed-in workspace",
    ],
    dependencies: ["Configured intelligence backend", "Supabase session for console Copilot"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-03",
  },
  {
    id: "zentro-assistant",
    name: "Zentro Assistant",
    publicName: "Zentro Assistant",
    description: "Personal intelligent workspace for productivity — distinct from team AI chat.",
    maturity: "live",
    repository: "Zentro Assistant workspace (separate deployment)",
    productPagePath: "/products/zentro-assistant",
    productUrl: "https://assistant.zentro.run",
    docsUrl: `${SITE()}/developers`,
    availableActions: [
      { kind: "open_product", label: "Open Assistant", href: "https://assistant.zentro.run", external: true },
      { kind: "product_page", label: "Product overview", href: "/products/zentro-assistant" },
      { kind: "read_docs", label: "Developers", href: "/developers" },
    ],
    capabilities: ["Personal productivity workspace", "Zentro identity sign-in", "Ecosystem integration"],
    limitations: ["Separate workspace from Zentro AI team chat"],
    dependencies: ["Zentro identity"],
    pilotAvailable: false,
    lastVerifiedAt: "2026-08-03",
  },
  {
    id: "private-ai",
    name: "Private AI",
    publicName: "Private AI",
    description: "Private AI workspace for organizations needing greater control and deployment options.",
    maturity: "live",
    repository: "Private AI workspace (separate deployment)",
    productPagePath: "/products/private-ai",
    productUrl: "https://pri.zentro.run",
    docsUrl: `${SITE()}/enterprise`,
    availableActions: [
      { kind: "open_product", label: "Open Private AI", href: "https://pri.zentro.run", external: true },
      { kind: "product_page", label: "Product overview", href: "/products/private-ai" },
      { kind: "contact", label: "Enterprise contact", href: "/contact?inquiry=enterprise" },
    ],
    capabilities: ["Organization-scoped private AI workspace", "Enterprise deployment discussions"],
    limitations: ["Not a replacement for all Zentro AI use cases", "Deployment options vary by engagement"],
    dependencies: ["Zentro identity", "Enterprise governance (where enabled)"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-03",
  },
  {
    id: "zentro-log",
    name: "Zentro Log",
    publicName: "Zentro Log",
    description: "Administrator operational workspace — not a consumer-facing product.",
    maturity: "live",
    repository: "Zentro Log workspace (separate deployment)",
    productPagePath: "/products/zentro-log",
    productUrl: "https://log.zentro.run",
    docsUrl: `${SITE()}/security`,
    availableActions: [
      { kind: "open_product", label: "Open Log", href: "https://log.zentro.run", external: true },
      { kind: "product_page", label: "Product overview", href: "/products/zentro-log" },
      { kind: "read_docs", label: "Security", href: "/security" },
    ],
    capabilities: ["Administrator operational review workspace"],
    limitations: ["Restricted to authorized administrators", "Not marketed as a consumer product"],
    dependencies: ["Zentro Platform audit modules", "Zentro identity"],
    pilotAvailable: false,
    lastVerifiedAt: "2026-08-03",
  },
  {
    id: "zentro-own-api",
    name: "Zentro Own API",
    publicName: "Zentro Own API",
    description: "Documented HTTP API surface on zentro.run and optional Own API service.",
    maturity: "live",
    repository: "github.com/aicodeai50/ZENTRO (this repo) + ZENTRO-OWN-API-V2",
    productPagePath: "/products/zentro-own-api",
    docsUrl: `${SITE()}/docs/api`,
    healthCheck: { host: "zentro.run", path: "/api/health" },
    availableActions: [
      { kind: "read_docs", label: "API reference", href: "/docs/api" },
      { kind: "view_health", label: "View health", href: "/api/health" },
      { kind: "sign_in", label: "Create API key", href: "/auth/sign-in?next=/settings/api-keys" },
      { kind: "product_page", label: "Product overview", href: "/products/zentro-own-api" },
    ],
    capabilities: ["Public API catalog", "API keys (zentro_sk_)", "Alert ingest tokens", "Webhooks"],
    limitations: ["Private Railway URLs proxied server-side only"],
    dependencies: ["Supabase", "Optional ZENTRO-OWN-API service"],
    pilotAvailable: false,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "identity",
    name: "Identity",
    publicName: "Identity",
    description: "Authentication, org RBAC, and API keys for the ecosystem.",
    maturity: "live",
    repository: "github.com/aicodeai50/ZENTRO (this repo)",
    productPagePath: "/products/identity",
    productUrl: `${SITE()}/auth/sign-in`,
    docsUrl: `${SITE()}/security`,
    availableActions: [
      { kind: "sign_in", label: "Sign in", href: "/auth/sign-in" },
      { kind: "sign_in", label: "Manage API keys", href: "/auth/sign-in?next=/settings/api-keys" },
      { kind: "read_docs", label: "Security", href: "/security" },
      { kind: "product_page", label: "Product overview", href: "/products/identity" },
    ],
    capabilities: ["Supabase Auth", "Org members and roles", "API keys and ingest tokens"],
    limitations: ["Service role keys server-only"],
    dependencies: ["Supabase Auth"],
    pilotAvailable: false,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "agents",
    name: "Agents",
    publicName: "Agents",
    description: "Guarded automation playbooks with dry-runs and approvals.",
    maturity: "prototype",
    repository: "github.com/aicodeai50/ZENTRO (this repo)",
    productPagePath: "/products/agents",
    productUrl: `${SITE()}/auth/sign-in?next=/automations`,
    docsUrl: `${SITE()}/docs/api`,
    availableActions: [
      { kind: "sign_in", label: "Open automations", href: "/auth/sign-in?next=/automations" },
      { kind: "join_pilot", label: "Join pilot", href: "/contact?inquiry=pilot&product=agents" },
      { kind: "view_changelog", label: "View progress", href: "/changelog" },
      { kind: "product_page", label: "Product overview", href: "/products/agents" },
    ],
    capabilities: ["Dry-run API", "Robot backend proxy when configured", "Approval linkage"],
    limitations: ["Prototype — dedicated agent registry planned", "Live execution requires plan and connectors"],
    dependencies: ["Zentro Platform", "Optional robot backend"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "analytics",
    name: "Analytics",
    publicName: "Analytics",
    description: "Operational metrics via Overview and hub dashboards.",
    maturity: "preview",
    repository: "github.com/aicodeai50/ZENTRO (this repo)",
    productPagePath: "/products/analytics",
    productUrl: `${SITE()}/auth/sign-in?next=/overview`,
    docsUrl: `${SITE()}/docs/api`,
    availableActions: [
      { kind: "sign_in", label: "Open overview", href: "/auth/sign-in?next=/overview" },
      { kind: "join_pilot", label: "Join pilot", href: "/contact?inquiry=pilot&product=analytics" },
      { kind: "view_changelog", label: "View progress", href: "/changelog" },
      { kind: "product_page", label: "Product overview", href: "/products/analytics" },
    ],
    capabilities: ["Overview command center", "SLO / error budget APIs when configured"],
    limitations: ["Dedicated analytics module route planned", "Requires signed-in workspace"],
    dependencies: ["Zentro Platform"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "memory-pendant",
    name: "Memory Pendant",
    publicName: "Memory Pendant",
    description: "Connected caregiver software — AI-assisted workflows under active development.",
    maturity: "prototype",
    repository: "Memory Pendant backend (separate repository — not modified here)",
    productPagePath: "/products/memory-pendant",
    docsUrl: `${SITE()}/architecture`,
    availableActions: [
      { kind: "product_page", label: "Product overview", href: "/products/memory-pendant" },
      { kind: "join_pilot", label: "Apply for pilot", href: "/contact?inquiry=pilot&product=memory-pendant" },
      { kind: "contact", label: "Contact Zentro", href: "/contact?inquiry=product&product=memory-pendant" },
    ],
    capabilities: ["Product definition and architecture documented", "Pilot intake via contact form"],
    limitations: [
      "Not a certified medical device",
      "Under active development — hardware integration pending",
      "Featured in Healthcare solutions, not a flagship product",
      "No public patient data on zentro.run",
    ],
    dependencies: ["Zentro AI", "Agents (planned integration)"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "projects",
    name: "Projects",
    publicName: "Projects",
    description: "Team and environment organization — building on live org RBAC.",
    maturity: "planned",
    repository: "github.com/aicodeai50/ZENTRO (this repo)",
    productPagePath: "/products/projects",
    docsUrl: `${SITE()}/docs`,
    availableActions: [
      { kind: "sign_in", label: "Org members (foundation)", href: "/auth/sign-in?next=/settings/members" },
      { kind: "view_changelog", label: "Follow progress", href: "/changelog" },
      { kind: "product_page", label: "Product overview", href: "/products/projects" },
    ],
    capabilities: ["Org members and roles live today"],
    limitations: ["Project scopes and pinning not yet available"],
    dependencies: ["Identity", "Zentro Platform"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    publicName: "Knowledge",
    description: "Operational knowledge — runbooks live; unified product layer planned.",
    maturity: "planned",
    repository: "github.com/aicodeai50/ZENTRO (this repo)",
    productPagePath: "/products/knowledge",
    productUrl: `${SITE()}/auth/sign-in?next=/runbooks`,
    docsUrl: `${SITE()}/docs`,
    availableActions: [
      { kind: "sign_in", label: "Runbooks (live module)", href: "/auth/sign-in?next=/runbooks" },
      { kind: "view_changelog", label: "Follow progress", href: "/changelog" },
      { kind: "product_page", label: "Product overview", href: "/products/knowledge" },
    ],
    capabilities: ["Runbooks module in Platform", "Compliance evidence mapping (beta)"],
    limitations: ["Unified knowledge search planned"],
    dependencies: ["Zentro Platform", "Zentro AI (grounding planned)"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
] as const;

export const ALLOWLISTED_PUBLIC_HOSTS = ECOSYSTEM_PUBLIC_HOSTS;

export function getRegistryProduct(id: string): ProductRegistryEntry | undefined {
  return PRODUCT_REGISTRY.find((p) => p.id === id);
}

export function getAllRegistryProducts(): readonly ProductRegistryEntry[] {
  return PRODUCT_REGISTRY;
}

export function registryMaturityLabel(m: RegistryMaturity): string {
  switch (m) {
    case "live":
      return "Live";
    case "preview":
      return "Preview";
    case "prototype":
      return "Prototype";
    case "internal":
      return "Internal";
    case "planned":
      return "Planned";
  }
}

/** Validates configured public URLs — throws in tests if invalid. */
export function validateProductRegistry(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const p of PRODUCT_REGISTRY) {
    if (ids.has(p.id)) errors.push(`duplicate id: ${p.id}`);
    ids.add(p.id);
    for (const action of p.availableActions) {
      if (action.href.includes("railway.internal") || action.href.includes(".up.railway.app")) {
        errors.push(`${p.id}: action href contains internal Railway URL`);
      }
      if (action.kind === "open_product" && p.maturity === "planned") {
        errors.push(`${p.id}: planned product must not have open_product action`);
      }
    }
    if (p.productUrl) {
      try {
        const u = new URL(p.productUrl);
        if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
          errors.push(`${p.id}: productUrl must be HTTPS`);
        }
        if (
          !ALLOWLISTED_PUBLIC_HOSTS.some(
            (h) => u.hostname === h || u.hostname.endsWith(`.${h}`) || u.hostname === "localhost",
          ) &&
          !u.hostname.endsWith("zentro.run")
        ) {
          if (u.hostname !== "ai.zentro.run" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
            errors.push(`${p.id}: productUrl host not allowlisted: ${u.hostname}`);
          }
        }
      } catch {
        errors.push(`${p.id}: invalid productUrl`);
      }
    }
  }
  const ai = PRODUCT_REGISTRY.find((p) => p.id === "zentro-ai");
  if (!ai?.productUrl?.startsWith("https://ai.zentro.run")) {
    errors.push("zentro-ai must use https://ai.zentro.run as public product URL");
  }
  return errors;
}

export function registryToEcosystemStatus(
  m: RegistryMaturity,
): "live" | "preview" | "prototype" | "coming-soon" {
  switch (m) {
    case "live":
      return "live";
    case "preview":
      return "preview";
    case "prototype":
      return "prototype";
    case "internal":
      return "preview";
    case "planned":
      return "coming-soon";
  }
}
