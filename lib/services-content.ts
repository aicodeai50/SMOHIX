/**
 * Zentro Technologies professional services — revenue path alongside product development.
 * No invented pricing; CTAs route to pilot application.
 */

export type ZentroService = {
  id: string;
  title: string;
  problem: string;
  outcome: string;
  audience: string;
  relatedProducts: readonly string[];
};

export const ZENTRO_SERVICES: readonly ZentroService[] = [
  {
    id: "ai-integration",
    title: "AI assistant integration",
    problem: "Teams want Copilot-style assistance inside operational workflows, not a disconnected chat tab.",
    outcome: "Same-origin AI routes, optional reasoning backend, and guardrails tied to your console.",
    audience: "Platform and product teams adopting AI with accountability.",
    relatedProducts: ["Zentro AI", "Zentro Platform"],
  },
  {
    id: "internal-systems",
    title: "Internal business systems",
    problem: "Spreadsheet-driven ops and ad-hoc tools do not scale with audit or approval requirements.",
    outcome: "Unified hub modules — incidents, automations, runbooks — on one identity spine.",
    audience: "Operations and IT leaders modernizing internal tooling.",
    relatedProducts: ["Zentro Platform", "Projects"],
  },
  {
    id: "api-development",
    title: "API development",
    problem: "Integrators need stable, documented surfaces instead of one-off endpoints per project.",
    outcome: "Cataloged routes, API keys, webhooks, and proxy patterns documented at /docs/api.",
    audience: "Engineering teams building on Zentro Own API and ingest.",
    relatedProducts: ["Zentro Own API", "Developers"],
  },
  {
    id: "workflow-automation",
    title: "Workflow automation",
    problem: "Production automation without dry-runs or approvals creates unacceptable blast radius.",
    outcome: "Playbooks, robot-backend proxies, remediation receipts, and approval gates.",
    audience: "SRE and automation engineers.",
    relatedProducts: ["Agents", "Zentro Platform"],
  },
  {
    id: "cloud-deployment",
    title: "Cloud deployment",
    problem: "Frontend and private backends must communicate without exposing internal Railway URLs.",
    outcome: "Railway deployment with env-configured proxies and health checks.",
    audience: "DevOps teams deploying zentro.run and connected services.",
    relatedProducts: ["Cloud", "Zentro Platform"],
  },
  {
    id: "dashboards",
    title: "Dashboard development",
    problem: "Leaders need operational signals without standing up a separate BI stack.",
    outcome: "Overview, hub stats, and SLO views using live workspace data.",
    audience: "Engineering managers and platform leads.",
    relatedProducts: ["Analytics", "Zentro Platform"],
  },
  {
    id: "developer-tooling",
    title: "Developer tooling",
    problem: "Builders need docs, keys, and examples aligned with what actually ships.",
    outcome: "Developer hub, API reference, GitHub source, and integration guides.",
    audience: "Developer relations and platform engineering.",
    relatedProducts: ["Developers", "Zentro Own API"],
  },
  {
    id: "prototyping",
    title: "Technical prototyping",
    problem: "Ideas need a fast path to a working prototype with honest maturity labels.",
    outcome: "Preview or prototype modules on zentro.run with a clear roadmap to production.",
    audience: "Founders and innovation teams.",
    relatedProducts: ["Agents", "Memory Pendant"],
  },
  {
    id: "healthcare-prototypes",
    title: "Healthcare technology prototypes",
    problem: "Regulated contexts need evidence trails — not marketing claims about certification.",
    outcome: "Compliance-oriented modules (beta) with audit export — scope defined per engagement.",
    audience: "Healthcare IT and compliance-aware product teams.",
    relatedProducts: ["Knowledge", "Zentro Platform"],
  },
  {
    id: "security-ops",
    title: "Security and operations workflows",
    problem: "Security and ops teams need one command layer for incidents, vulns, and guarded change.",
    outcome: "Incident command, vulnerability ingest, approvals, and audit in one console.",
    audience: "SOC, platform security, and GRC teams.",
    relatedProducts: ["Zentro Platform", "Identity"],
  },
] as const;
