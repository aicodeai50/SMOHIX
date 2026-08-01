export type SearchEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "product" | "documentation" | "page";
  keywords: readonly string[];
};

export const SEARCH_INDEX: readonly SearchEntry[] = [
  { id: "home", title: "Home", description: "Zentro Technologies homepage", href: "/", category: "page", keywords: ["home", "zentro"] },
  { id: "products", title: "Product Access", description: "Open live Zentro products", href: "/products", category: "page", keywords: ["products", "access", "ecosystem"] },
  { id: "explore", title: "Explore Zentro", description: "Product orientation", href: "/explore", category: "page", keywords: ["explore", "tour", "orientation"] },
  { id: "zentro-platform", title: "Zentro Platform", description: "Operational command layer", href: "/products/zentro-platform", category: "product", keywords: ["platform", "incidents", "audit"] },
  { id: "zentro-ai", title: "Zentro AI", description: "Copilot and ai.zentro.run", href: "/products/zentro-ai", category: "product", keywords: ["ai", "copilot", "chat"] },
  { id: "zentro-own-api", title: "Zentro Own API", description: "API catalog and integration", href: "/products/zentro-own-api", category: "product", keywords: ["api", "keys", "webhooks"] },
  { id: "identity", title: "Identity", description: "Auth, RBAC, API keys", href: "/products/identity", category: "product", keywords: ["identity", "auth", "sso"] },
  { id: "agents", title: "Agents", description: "Automation playbooks", href: "/products/agents", category: "product", keywords: ["agents", "automation"] },
  { id: "analytics", title: "Analytics", description: "Operational metrics", href: "/products/analytics", category: "product", keywords: ["analytics", "slo", "metrics"] },
  { id: "projects", title: "Projects", description: "Team organization", href: "/products/projects", category: "product", keywords: ["projects", "teams"] },
  { id: "knowledge", title: "Knowledge", description: "Runbooks and context", href: "/products/knowledge", category: "product", keywords: ["knowledge", "runbooks"] },
  { id: "memory-pendant", title: "Memory Pendant", description: "Agent memory prototype", href: "/products/memory-pendant", category: "product", keywords: ["memory", "pendant"] },
  { id: "developers", title: "Developers", description: "Developer hub", href: "/developers", category: "documentation", keywords: ["developers", "sdk", "integrate"] },
  { id: "docs", title: "Documentation", description: "Guides and setup", href: "/docs", category: "documentation", keywords: ["docs", "documentation", "guide"] },
  { id: "docs-api", title: "API reference", description: "HTTP API catalog", href: "/docs/api", category: "documentation", keywords: ["api", "reference", "rest"] },
  { id: "playground", title: "API request builder", description: "Copyable API examples", href: "/playground", category: "page", keywords: ["playground", "curl", "examples"] },
  { id: "use-cases", title: "Use cases", description: "Scenario-based solutions", href: "/use-cases", category: "page", keywords: ["use cases", "scenarios"] },
  { id: "faq", title: "FAQ", description: "Frequently asked questions", href: "/faq", category: "page", keywords: ["faq", "questions"] },
  { id: "status", title: "Status", description: "Service availability", href: "/status", category: "page", keywords: ["status", "health", "uptime"] },
  { id: "trust", title: "Trust center", description: "Security and privacy", href: "/trust", category: "page", keywords: ["trust", "security", "privacy"] },
  { id: "pilot", title: "Pilot program", description: "Scoped pilots", href: "/pilot", category: "page", keywords: ["pilot", "trial"] },
  { id: "enterprise", title: "Enterprise", description: "Enterprise programs", href: "/enterprise", category: "page", keywords: ["enterprise"] },
  { id: "architecture", title: "Architecture", description: "System architecture", href: "/architecture", category: "documentation", keywords: ["architecture", "diagram"] },
  { id: "pricing", title: "Pricing", description: "Plans and billing", href: "/pricing", category: "page", keywords: ["pricing", "plans"] },
  { id: "contact", title: "Contact", description: "Get in touch", href: "/contact", category: "page", keywords: ["contact", "sales"] },
] as const;

export function searchIndex(query: string, limit = 20): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...SEARCH_INDEX].slice(0, limit);
  const scored = SEARCH_INDEX.map((entry) => {
    let score = 0;
    if (entry.title.toLowerCase().includes(q)) score += 10;
    if (entry.description.toLowerCase().includes(q)) score += 5;
    for (const kw of entry.keywords) {
      if (kw.includes(q) || q.includes(kw)) score += 3;
    }
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.entry);
}
