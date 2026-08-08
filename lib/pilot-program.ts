/**
 * Smohix Technologies pilot program — truthful scope for pre-GA collaboration.
 */

export type PilotCategory = {
  id: string;
  title: string;
  description: string;
};

export const PILOT_CATEGORIES: readonly PilotCategory[] = [
  {
    id: "company-ai",
    title: "Company AI assistant",
    description: "Copilot and reasoning integrated into your operational workflow with guardrails.",
  },
  {
    id: "knowledge",
    title: "Internal knowledge assistant",
    description: "Runbooks and operational context connected to incidents and Copilot threads.",
  },
  {
    id: "automation",
    title: "Workflow automation",
    description: "Guarded automations with dry-runs, approvals, and audit evidence.",
  },
  {
    id: "incidents",
    title: "Incident and operations workflow",
    description: "Incident command, approvals, and connector health in one workspace.",
  },
  {
    id: "integration",
    title: "API and system integration",
    description: "Alert ingest, webhooks, and same-origin proxies to your backends.",
  },
  {
    id: "dashboard",
    title: "Dashboard or internal system",
    description: "Command center views, SLO context, and hub personalization.",
  },
  {
    id: "healthcare",
    title: "Healthcare technology prototype",
    description: "Evidence-oriented workflows — not a claim of regulatory certification.",
  },
  {
    id: "developer-platform",
    title: "Developer platform integration",
    description: "API keys, catalog routes, and billing event surfaces.",
  },
] as const;

export const PILOT_PROCESS = [
  "Intro call to align scope, constraints, and maturity expectations.",
  "Pilot charter — capabilities in scope, data boundaries, and success signals.",
  "Configuration on smohix.run with your team (connectors, roles, ingest as needed).",
  "Iterative review with honest maturity labels — no pretense that preview features are GA.",
  "Joint decision: expand, pause, or transition to production billing where applicable.",
] as const;

export const PILOT_DELIVERABLES = [
  "Dedicated workspace on smohix.run with org RBAC",
  "Documented integration points (API catalog, ingest tokens, connectors)",
  "Audit and approval workflows where in scope",
  "Regular check-ins and written progress notes",
  "Clear handoff or scale path — no lock-in beyond your data export choices",
] as const;

export const PILOT_AUDIENCE = [
  "Platform, SRE, and security teams evaluating accountable AI operations",
  "Product and engineering leaders building internal tools on a unified platform",
  "Healthcare and regulated teams needing evidence trails — without certification claims",
  "Developers integrating billing, ingest, or automation via documented APIs",
] as const;

export const PILOT_SECURITY_PRINCIPLES = [
  "Server-side secrets — API keys and private backend URLs never ship to the browser",
  "Supabase auth and RLS-scoped workspace data",
  "Human-in-the-loop gates for high-impact automation",
  "Data minimization — scope only what the pilot requires",
  "Transparent product maturity — preview and prototype features labeled honestly",
] as const;
