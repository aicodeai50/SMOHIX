/**
 * Three primary commercial paths for Smohix.run visitors.
 * Used consistently across homepage, nav-adjacent CTAs, product pages, and footer.
 */

import type { AnalyticsEvent } from "@/lib/analytics";

export type CommercialPathId = "try" | "pilot" | "build";

export type CommercialPath = {
  id: CommercialPathId;
  title: string;
  description: string;
  href: string;
  cta: string;
  analyticsEvent: AnalyticsEvent;
};

export const COMMERCIAL_PATHS: readonly CommercialPath[] = [
  {
    id: "try",
    title: "Try Smohix",
    description:
      "Explore live products — Platform, AI, Own API, and Identity — or preview capabilities marked honestly.",
    href: "/products",
    cta: "Explore products",
    analyticsEvent: "explore_products",
  },
  {
    id: "pilot",
    title: "Start a pilot",
    description:
      "Work with Smohix Technologies on AI assistants, automation, integrations, or healthcare prototypes before full product maturity.",
    href: "/pilot",
    cta: "Apply for a pilot",
    analyticsEvent: "start_pilot",
  },
  {
    id: "build",
    title: "Build with Smohix",
    description:
      "Use the API catalog, API keys, documentation, and GitHub source to integrate with the Smohix platform.",
    href: "/developers",
    cta: "Developer hub",
    analyticsEvent: "build_with_smohix",
  },
] as const;

export const COMMERCIAL_PATH_MAP = new Map(
  COMMERCIAL_PATHS.map((p) => [p.id, p]),
);
