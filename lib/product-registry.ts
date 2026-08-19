/**
 * Single source of truth for Smohix Technologies public products.
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
  healthCheck?: { host: "smohix.run" | "ai.smohix.run"; path: string };
  availableActions: readonly ProductAction[];
  capabilities: readonly string[];
  limitations: readonly string[];
  dependencies: readonly string[];
  pilotAvailable: boolean;
  lastVerifiedAt: string;
};

const SITE = () => getSiteUrl().replace(/\/$/, "");
const AI_PUBLIC = (process.env.SMOHIX_AI_PUBLIC_URL ?? process.env.ZENTRO_AI_PUBLIC_URL)?.trim() || "https://ai.smohix.run";

export const SMOHIX_AI_PUBLIC_URL = AI_PUBLIC;

export const PRODUCT_REGISTRY: readonly ProductRegistryEntry[] = [
  {
    id: "smohix-platform",
    name: "Smohix Platform",
    publicName: "Smohix Platform",
    description: "Operational command layer — incidents, automation, approvals, and audit.",
    maturity: "live",
    repository: "github.com/aicodeai50/SMOHIX (this repo)",
    productPagePath: "/products/smohix-platform",
    productUrl: `${SITE()}/auth/sign-in?next=/hub`,
    docsUrl: `${SITE()}/docs`,
    healthCheck: { host: "smohix.run", path: "/api/health" },
    availableActions: [
      { kind: "sign_in", label: "Open console", href: "/auth/sign-in?next=/hub" },
      { kind: "read_docs", label: "Documentation", href: "/docs" },
      { kind: "product_page", label: "Product overview", href: "/products/smohix-platform" },
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
    id: "smohix-ai",
    name: "Smohix AI",
    publicName: "Smohix AI",
    description: "Copilot and reasoning — standalone product and console integration.",
    maturity: "live",
    repository: "Smohix AI backend (separate repository — not modified here)",
    productPagePath: "/products/smohix-ai",
    productUrl: AI_PUBLIC,
    docsUrl: `${SITE()}/docs/api`,
    healthCheck: { host: "ai.smohix.run", path: "/" },
    availableActions: [
      { kind: "open_product", label: "Open Smohix AI", href: AI_PUBLIC, external: true },
      { kind: "sign_in", label: "Copilot in console", href: "/auth/sign-in?next=/copilot" },
      { kind: "read_docs", label: "Copilot API routes", href: "/docs/api" },
      { kind: "product_page", label: "Product overview", href: "/products/smohix-ai" },
    ],
    capabilities: [
      "Standalone app at ai.smohix.run",
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
    id: "smohix-assistant",
    name: "Smohix Assistant",
    publicName: "Smohix Assistant",
    description: "Personal intelligent workspace for productivity — distinct from team AI chat.",
    maturity: "live",
    repository: "Smohix Assistant workspace (separate deployment)",
    productPagePath: "/products/smohix-assistant",
    productUrl: "https://assistant.smohix.run",
    docsUrl: `${SITE()}/developers`,
    availableActions: [
      { kind: "open_product", label: "Open Assistant", href: "https://assistant.smohix.run", external: true },
      { kind: "product_page", label: "Product overview", href: "/products/smohix-assistant" },
      { kind: "read_docs", label: "Developers", href: "/developers" },
    ],
    capabilities: ["Personal productivity workspace", "Smohix identity sign-in", "Ecosystem integration"],
    limitations: ["Separate workspace from Smohix AI team chat"],
    dependencies: ["Smohix identity"],
    pilotAvailable: false,
    lastVerifiedAt: "2026-08-03",
  },
  {
    id: "private-ai",
    name: "Smohix PRI",
    publicName: "Smohix PRI",
    description: "Private AI workspace for organizations needing greater control and deployment options.",
    maturity: "live",
    repository: "Smohix PRI workspace (separate deployment)",
    productPagePath: "/products/private-ai",
    productUrl: "https://pri.smohix.run",
    docsUrl: `${SITE()}/enterprise`,
    availableActions: [
      { kind: "open_product", label: "Open Smohix PRI", href: "https://pri.smohix.run", external: true },
      { kind: "product_page", label: "Product overview", href: "/products/private-ai" },
      { kind: "contact", label: "Enterprise contact", href: "/contact?inquiry=enterprise" },
    ],
    capabilities: ["Organization-scoped private AI workspace", "Enterprise deployment discussions"],
    limitations: ["Not a replacement for all Smohix AI use cases", "Deployment options vary by engagement"],
    dependencies: ["Smohix identity", "Enterprise governance (where enabled)"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-03",
  },
  {
    id: "smohix-log",
    name: "Smohix Log",
    publicName: "Smohix Log",
    description: "Administrator operational workspace — not a consumer-facing product.",
    maturity: "live",
    repository: "Smohix Log workspace (separate deployment)",
    productPagePath: "/products/smohix-log",
    productUrl: "https://log.smohix.run",
    docsUrl: `${SITE()}/security`,
    availableActions: [
      { kind: "open_product", label: "Open Log", href: "https://log.smohix.run", external: true },
      { kind: "product_page", label: "Product overview", href: "/products/smohix-log" },
      { kind: "read_docs", label: "Security", href: "/security" },
    ],
    capabilities: ["Administrator operational review workspace"],
    limitations: ["Restricted to authorized administrators", "Not marketed as a consumer product"],
    dependencies: ["Smohix Platform audit modules", "Smohix identity"],
    pilotAvailable: false,
    lastVerifiedAt: "2026-08-03",
  },
  {
    id: "smohix-own-api",
    name: "Smohix Own API",
    publicName: "Smohix Own API",
    description: "Documented HTTP API surface on smohix.run and optional Own API service.",
    maturity: "live",
    repository: "github.com/aicodeai50/SMOHIX (this repo) + SMOHIX-OWN-API-V2",
    productPagePath: "/products/smohix-own-api",
    docsUrl: `${SITE()}/docs/api`,
    healthCheck: { host: "smohix.run", path: "/api/health" },
    availableActions: [
      { kind: "read_docs", label: "API reference", href: "/docs/api" },
      { kind: "view_health", label: "View health", href: "/api/health" },
      { kind: "sign_in", label: "Create API key", href: "/auth/sign-in?next=/settings/api-keys" },
      { kind: "product_page", label: "Product overview", href: "/products/smohix-own-api" },
    ],
    capabilities: [
      "Public Smohix API catalog",
      "API keys",
      "Alert ingest tokens",
      "Webhooks",
    ],
    limitations: ["Private Railway URLs proxied server-side only — not published as public hosts"],
    dependencies: ["Supabase", "Optional Smohix Own API service"],
    pilotAvailable: false,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "identity",
    name: "Smohix Identity",
    publicName: "Smohix Identity",
    description: "Authentication, org RBAC, and API keys for the ecosystem.",
    maturity: "live",
    repository: "github.com/aicodeai50/SMOHIX (this repo)",
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
    repository: "github.com/aicodeai50/SMOHIX (this repo)",
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
    dependencies: ["Smohix Platform", "Optional robot backend"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "analytics",
    name: "Analytics",
    publicName: "Analytics",
    description: "Operational metrics via Overview and hub dashboards.",
    maturity: "preview",
    repository: "github.com/aicodeai50/SMOHIX (this repo)",
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
    dependencies: ["Smohix Platform"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "projects",
    name: "Projects",
    publicName: "Projects",
    description: "Team and environment organization — building on live org RBAC.",
    maturity: "planned",
    repository: "github.com/aicodeai50/SMOHIX (this repo)",
    productPagePath: "/products/projects",
    docsUrl: `${SITE()}/docs`,
    availableActions: [
      { kind: "sign_in", label: "Org members (foundation)", href: "/auth/sign-in?next=/settings/members" },
      { kind: "view_changelog", label: "Follow progress", href: "/changelog" },
      { kind: "product_page", label: "Product overview", href: "/products/projects" },
    ],
    capabilities: ["Org members and roles live today"],
    limitations: ["Project scopes and pinning not yet available"],
    dependencies: ["Identity", "Smohix Platform"],
    pilotAvailable: true,
    lastVerifiedAt: "2026-08-01",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    publicName: "Knowledge",
    description: "Operational knowledge — runbooks live; unified product layer planned.",
    maturity: "planned",
    repository: "github.com/aicodeai50/SMOHIX (this repo)",
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
    dependencies: ["Smohix Platform", "Smohix AI (grounding planned)"],
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
          !u.hostname.endsWith("smohix.run")
        ) {
          if (u.hostname !== "ai.smohix.run" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
            errors.push(`${p.id}: productUrl host not allowlisted: ${u.hostname}`);
          }
        }
      } catch {
        errors.push(`${p.id}: invalid productUrl`);
      }
    }
  }
  const ai = PRODUCT_REGISTRY.find((p) => p.id === "smohix-ai");
  if (!ai?.productUrl?.startsWith("https://ai.smohix.run")) {
    errors.push("smohix-ai must use https://ai.smohix.run as public product URL");
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
