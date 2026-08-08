/**
 * Industry solution pages — executive-facing copy only.
 */

export type SolutionPage = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  outcomes: readonly string[];
  relatedProducts: readonly { href: string; label: string }[];
  relatedProjects?: readonly { name: string; description: string; href?: string; note?: string }[];
  cta: { href: string; label: string };
};

export const SOLUTION_PAGES: readonly SolutionPage[] = [
  {
    slug: "business-automation",
    title: "Business Automation",
    eyebrow: "Solutions",
    description:
      "Operational automation with human gates, audit trails, and honest maturity labels — built for teams that cannot afford silent failures in production.",
    outcomes: [
      "Incident and change workflows in one operational workspace",
      "Guarded automations with dry-runs and approvals",
      "Evidence export for review and procurement",
    ],
    relatedProducts: [
      { href: "/products/smohix-platform", label: "Smohix Platform" },
      { href: "/products/agents", label: "Agents" },
    ],
    cta: { href: "/pilot", label: "Start a pilot" },
  },
  {
    slug: "enterprise-ai",
    title: "Enterprise AI",
    eyebrow: "Solutions",
    description:
      "Enterprise AI programs need routing, access control, and operational accountability — not a disconnected chat tab.",
    outcomes: [
      "Flagship AI workspace plus console integration",
      "Private AI options for greater deployment control",
      "Identity, roles, and API access across the ecosystem",
    ],
    relatedProducts: [
      { href: "/products/smohix-ai", label: "Smohix AI" },
      { href: "/products/private-ai", label: "Private AI" },
      { href: "/enterprise", label: "Enterprise" },
    ],
    cta: { href: "/contact?inquiry=enterprise", label: "Contact enterprise sales" },
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    eyebrow: "Solutions",
    description:
      "Healthcare teams need controlled workflows, evidence trails, and honest product maturity — especially when patient-adjacent software is involved.",
    outcomes: [
      "Compliance-oriented platform modules (beta) with audit export",
      "Professional services for scoped healthcare engagements",
      "Caregiver technology projects under active development",
    ],
    relatedProducts: [
      { href: "/products/smohix-platform", label: "Smohix Platform" },
      { href: "/products/knowledge", label: "Knowledge" },
    ],
    relatedProjects: [
      {
        name: "Memory Pendant",
        description:
          "Connected caregiver software with AI-assisted workflows and patient memory support.",
        href: "/products/memory-pendant",
        note:
          "Under active development. Hardware integration pending. Not a certified medical device.",
      },
    ],
    cta: { href: "/contact?inquiry=healthcare", label: "Discuss healthcare scope" },
  },
  {
    slug: "education",
    title: "Education",
    eyebrow: "Solutions",
    description:
      "Institutions need sandboxes, clear audit paths, and products labeled honestly about what is live versus planned.",
    outcomes: [
      "Workspace isolation with organization-scoped access",
      "Developer documentation and API catalog for integrators",
      "Pilot programs for research and teaching use cases",
    ],
    relatedProducts: [
      { href: "/products/smohix-platform", label: "Smohix Platform" },
      { href: "/developers", label: "Developers" },
    ],
    cta: { href: "/pilot", label: "Apply for a pilot" },
  },
  {
    slug: "government",
    title: "Government",
    eyebrow: "Solutions",
    description:
      "Public-sector deployments require accountability-first architecture — we do not claim certifications we have not published.",
    outcomes: [
      "Governance and audit modules for serious rollouts",
      "Private AI deployment options for controlled environments",
      "Procurement-oriented trust and security documentation",
    ],
    relatedProducts: [
      { href: "/products/private-ai", label: "Private AI" },
      { href: "/enterprise", label: "Enterprise" },
      { href: "/trust", label: "Trust center" },
    ],
    cta: { href: "/contact?inquiry=enterprise", label: "Contact us" },
  },
] as const;

export function getSolutionPage(slug: string): SolutionPage | undefined {
  return SOLUTION_PAGES.find((s) => s.slug === slug);
}

export function getAllSolutionSlugs(): string[] {
  return SOLUTION_PAGES.map((s) => s.slug);
}
