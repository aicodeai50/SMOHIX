/**
 * Smohix product identity — single source for marketing copy, features, and positioning.
 * Smohix is the accountable operations platform at smohix.run (formerly shynvo).
 */

export const PRODUCT_TAGLINE =
  "Incident command, guarded automation, and audit-ready evidence." as const;

export const PRODUCT_HEADLINE =
  "Run incidents and automation with full accountability" as const;

export const PRODUCT_VALUE_PROPOSITION =
  "Smohix unifies incident response, service context, human approvals, and audit evidence in one workspace — so platform, SRE, and security teams can move fast without losing control." as const;

export const PRODUCT_AUDIENCE = [
  "Platform & SRE teams managing production incidents",
  "Security operations coordinating response and evidence",
  "GRC teams needing audit trails from live operations",
  "Engineering leads who require human gates on risky changes",
] as const;

export const PRODUCT_FEATURES = [
  {
    id: "incidents",
    title: "Incident command",
    description:
      "Track alerts through resolution with ownership, timelines, and linked service context.",
    icon: "alertTriangle" as const,
  },
  {
    id: "automations",
    title: "Guarded automation",
    description:
      "Dry-run playbooks, enforce approval gates, and execute with full evidence capture.",
    icon: "workflow" as const,
  },
  {
    id: "approvals",
    title: "Human-in-the-loop",
    description:
      "Route high-risk changes through delegated approvers with Slack and audit integration.",
    icon: "shieldCheck" as const,
  },
  {
    id: "audit",
    title: "Audit evidence",
    description:
      "Export immutable timelines and compliance-ready records from every action taken.",
    icon: "scrollText" as const,
  },
] as const;

export const PRICING_TIERS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Explore the console, incidents, and docs before upgrading.",
    features: [
      "Incident tracking & services catalog",
      "Automation dry-runs & review flows",
      "Community support",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For individual operators running incidents and guarded automations.",
    features: [
      "Full automation execution",
      "Alert ingest & API keys",
      "Audit export & Copilot",
      "PayPal billing",
    ],
    cta: "Subscribe — Pro",
    highlight: false,
  },
  {
    id: "team",
    name: "Team",
    price: "$79",
    period: "/month",
    description: "Shared workspace with org RBAC and team governance.",
    features: [
      "Everything in Pro",
      "Members & delegated approvers",
      "Compliance mapping (beta)",
      "Priority support",
    ],
    cta: "Subscribe — Team",
    highlight: true,
  },
] as const;

export type PricingTierId = (typeof PRICING_TIERS)[number]["id"];
