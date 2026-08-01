/**
 * Product page conversion enrichment and maturity-aware CTAs.
 */

import type { ProductMaturity, ProductPageContent } from "@/lib/ecosystem-graph";

export type ProductConversionMeta = {
  audience: string;
  worksToday: readonly string[];
};

export const PRODUCT_CONVERSION: Record<string, ProductConversionMeta> = {
  "zentro-platform": {
    audience: "Platform, SRE, SOC, and GRC teams running incidents and automation in production.",
    worksToday: [
      "Incidents, automations, approvals, and audit console",
      "PayPal billing and org-scoped settings",
      "Compliance and governance modules (beta)",
    ],
  },
  "zentro-ai": {
    audience: "Operators who need Copilot inside the same workspace as incidents and approvals.",
    worksToday: [
      "Copilot chat via same-origin /api/copilot/chat",
      "Optional OpenAI or reasoning backend proxy",
      "Thread persistence when signed in",
    ],
  },
  "zentro-own-api": {
    audience: "Integrators and platform engineers connecting billing, ingest, and webhooks.",
    worksToday: [
      "Public API catalog at /docs/api",
      "API keys and alert ingest tokens",
      "PayPal webhook sync and proxy routes",
    ],
  },
  "memory-pendant": {
    audience: "Teams planning durable agent memory across long-running workflows.",
    worksToday: ["Product page and pilot interest — backend not yet available on zentro.run"],
  },
  agents: {
    audience: "Automation engineers who need dry-runs and human gates before production execution.",
    worksToday: [
      "Automations console with dry-run API",
      "Robot backend proxy when configured",
      "Remediation receipts and approval linkage",
    ],
  },
  projects: {
    audience: "Organizations preparing for team and environment boundaries inside one tenant.",
    worksToday: ["Org members and RBAC in Settings — dedicated project scopes planned"],
  },
  knowledge: {
    audience: "Teams connecting runbooks, compliance evidence, and operational context.",
    worksToday: ["Runbooks module", "Compliance evidence mapping (beta)"],
  },
  analytics: {
    audience: "Leaders who want operational signals from the same Platform identity.",
    worksToday: ["Overview command center", "Hub stats", "SLO / error budget views where configured"],
  },
  identity: {
    audience: "Any team member or integrator needing one sign-in and programmatic access model.",
    worksToday: [
      "Supabase auth for console routes",
      "Org roles and delegated approvers",
      "zentro_sk_ API keys in Settings",
    ],
  },
};

export type ProductCta = { href: string; label: string; event: "product_cta" | "start_pilot" | "documentation_link" };

export function getProductConversion(slug: string): ProductConversionMeta | undefined {
  return PRODUCT_CONVERSION[slug];
}

export function getMaturityCtas(
  product: ProductPageContent,
): { primary: ProductCta; secondary?: ProductCta } {
  const maturity = product.maturity;

  if (maturity === "live") {
    return {
      primary: {
        href: product.primaryCta.href,
        label: product.primaryCta.label,
        event: "product_cta",
      },
      secondary: product.documentation[0]
        ? {
            href: product.documentation[0].href,
            label: "Read documentation",
            event: "documentation_link",
          }
        : product.secondaryCta
          ? {
              href: product.secondaryCta.href,
              label: product.secondaryCta.label,
              event: "product_cta",
            }
          : undefined,
    };
  }

  if (maturity === "preview" || maturity === "prototype") {
    return {
      primary: {
        href: `/contact?inquiry=pilot&product=${encodeURIComponent(product.slug)}`,
        label: "Join pilot",
        event: "start_pilot",
      },
      secondary: {
        href: "/changelog",
        label: "View progress",
        event: "documentation_link",
      },
    };
  }

  return {
    primary: {
      href: "/changelog",
      label: "Follow progress",
      event: "documentation_link",
    },
    secondary: {
      href: `/contact?inquiry=product&product=${encodeURIComponent(product.slug)}`,
      label: "Contact Zentro",
      event: "product_cta",
    },
  };
}

export function maturityCtaHint(maturity: ProductMaturity): string {
  switch (maturity) {
    case "live":
      return "Available today on zentro.run.";
    case "preview":
      return "Preview — limited availability; join a pilot for early access.";
    case "prototype":
      return "Prototype — core paths exist; not production-complete.";
    case "coming-soon":
      return "Coming soon — follow the changelog or contact us for updates.";
  }
}
