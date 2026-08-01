/**
 * Typed changelog — static source until GitHub releases integration.
 * Do not invent historical entries; add new rows when work ships.
 */

export type ChangelogCategory =
  | "zentro-run"
  | "zentro-ai"
  | "zentro-platform"
  | "zentro-own-api"
  | "sdk"
  | "memory-pendant"
  | "infrastructure";

export type ChangelogChangeType =
  | "released"
  | "improved"
  | "fixed"
  | "preview"
  | "prototype";

export type ChangelogEntry = {
  date: string;
  title: string;
  categories: readonly ChangelogCategory[];
  changeTypes: readonly ChangelogChangeType[];
  bullets: readonly string[];
};

export const CHANGELOG_CATEGORY_LABELS: Record<ChangelogCategory, string> = {
  "zentro-run": "Zentro.run",
  "zentro-ai": "Zentro AI",
  "zentro-platform": "Zentro Platform",
  "zentro-own-api": "Zentro Own API",
  sdk: "SDK",
  "memory-pendant": "Memory Pendant",
  infrastructure: "Infrastructure",
};

export const CHANGELOG_CHANGE_LABELS: Record<ChangelogChangeType, string> = {
  released: "Released",
  improved: "Improved",
  fixed: "Fixed",
  preview: "Preview",
  prototype: "Prototype",
};

/** Repository-supported history — migrated from prior changelog page. */
export const CHANGELOG_ENTRIES: readonly ChangelogEntry[] = [
  {
    date: "Jun 2026",
    title: "Professional product cleanup",
    categories: ["zentro-run", "zentro-platform"],
    changeTypes: ["improved"],
    bullets: [
      "Public homepage simplified around incident command, guarded automation, evidence, pricing, and CTA",
      "Integration page now separates available HTTP/webhook paths from planned native vendor connectors",
      "Console navigation reduced to core workflows with maturity labels for beta surfaces",
    ],
  },
  {
    date: "Jun 2026",
    title: "Incident command and enterprise foundations",
    categories: ["zentro-platform", "zentro-ai", "zentro-own-api"],
    changeTypes: ["released", "improved"],
    bullets: [
      "Incident assignees, command events, handoffs, notifications, and incident-scoped Copilot context",
      "Org-scoped billing, API keys, ingest tokens, Copilot threads, and integration connection records",
      "Deploy event ingest, automation policy versions, and remediation execution receipts",
    ],
  },
  {
    date: "May 2026",
    title: "Governance and audit evidence expansion",
    categories: ["zentro-platform"],
    changeTypes: ["released", "preview"],
    bullets: [
      "Compliance evidence bundles, assessor exports, framework mappings, retention controls, and legal hold support",
      "Organization RBAC, org-scoped audit rows, and auditor read-only workspace support",
      "Representative SOC 2, ISO 27001, PCI, HIPAA, NIST CSF, CIS, CMMC, and GDPR control packs",
    ],
  },
  {
    date: "May 2026",
    title: "Security operations depth",
    categories: ["zentro-platform", "infrastructure"],
    changeTypes: ["released", "improved"],
    bullets: [
      "Service catalog, SLO context, vulnerability ingest, exposure priority, pen-test rollups, and attack-path simulation from catalog data",
      "HTTP alert ingest normalizes common monitoring, paging, SIEM, and EDR payload shapes",
      "Guarded remediation flows connect incidents, approvals, dry-runs, and audit evidence",
    ],
  },
  {
    date: "May 2026",
    title: "Production hardening",
    categories: ["infrastructure", "zentro-ai"],
    changeTypes: ["improved", "fixed"],
    bullets: [
      "Distributed rate limiting with Upstash fallback, structured logs, optional Sentry capture, and release verification scripts",
      "Copilot access checks, fallback replies, thread persistence, and migration consistency checks",
      "Railway-ready release flow with lint, TypeScript, migration bundle checks, and Next.js build verification",
    ],
  },
  {
    date: "April 2026",
    title: "Core console, API docs, and positioning",
    categories: ["zentro-run", "zentro-platform", "zentro-own-api"],
    changeTypes: ["released"],
    bullets: [
      "Incident, overview, automations, audit, approvals, services, Copilot, runbooks, and hub console pages",
      "Public API documentation, pricing, platform overview, status, and buyer-facing product pages",
      "Health endpoint hardening, alert ingest extensions, and route-level loading/empty states",
    ],
  },
] as const;
