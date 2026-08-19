/**
 * Developer journey content — only real routes and capabilities from this repository.
 */

import { getSiteUrl } from "@/lib/site";
import { SMOHIX_AI_PUBLIC_URL } from "@/lib/product-registry";

const SITE = getSiteUrl().replace(/\/$/, "");

export type SdkStatus = "available" | "preview" | "coming-soon" | "planned";

export type SdkEntry = {
  name: string;
  status: SdkStatus;
  detail: string;
};

export const DEVELOPER_SDKS: readonly SdkEntry[] = [
  {
    name: "TypeScript / Next.js (this repo)",
    status: "available",
    detail: "Open-source web app at github.com/aicodeai50/SMOHIX — primary integration surface today.",
  },
  {
    name: "Smohix SDK (@smohix/sdk)",
    status: "preview",
    detail:
      "Preferred TypeScript package name for the Smohix API client. Publishing is in progress — use the documented REST catalog and API keys until the package is released.",
  },
  {
    name: "Python SDK",
    status: "coming-soon",
    detail: "Planned — use the Smohix API (REST) and API keys until published.",
  },
  {
    name: "CLI",
    status: "planned",
    detail: "Planned developer CLI for keys, ingest testing, and health checks.",
  },
] as const;

export const DEVELOPER_QUICK_START = [
  {
    step: "1. Read the Smohix API catalog",
    detail: "Browse authenticated and public routes at /docs/api.",
    href: "/docs/api",
  },
  {
    step: "2. Sign in and create an API key",
    detail:
      "Smohix API keys are created in Settings and sent as Authorization: Bearer <key>.",
    href: "/auth/sign-in?next=/settings/api-keys",
  },
  {
    step: "3. Send alert ingest or call a route",
    detail: "Use Bearer auth or ingest tokens as documented per route.",
    href: "/integrations",
  },
  {
    step: "4. Check connector health",
    detail: "Verify reasoning and robot proxies from Settings → Connectors.",
    href: "/auth/sign-in?next=/settings/connectors",
  },
] as const;

export const DEVELOPER_AUTH = {
  title: "Authentication",
  points: [
    "Browser sessions: Supabase Auth cookies on console routes.",
    "Programmatic access: Smohix API keys (Authorization: Bearer smohix_sk_…).",
    "Alert ingest: dedicated ingest tokens scoped per workspace.",
    "Webhooks: PayPal signature verification server-side; never expose secrets in client code.",
  ],
} as const;

export const DEVELOPER_EXAMPLE = `// Example: authenticated API request (server or script)
const res = await fetch("${SITE}/api/overview/error-budget-summary", {
  headers: {
    Authorization: "Bearer smohix_sk_your_key_here",
  },
});
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const data = await res.json();`;

export const DEVELOPER_AI_NOTE = {
  title: "Smohix AI",
  body: `Standalone product at ${SMOHIX_AI_PUBLIC_URL}. Console Copilot uses same-origin /api/copilot/chat with server-side keys — not embedded on marketing pages.`,
  href: SMOHIX_AI_PUBLIC_URL,
} as const;

export const DEVELOPER_ERROR_HANDLING = [
  "401 — missing or invalid API key / session.",
  "403 — org role or plan does not allow the action.",
  "429 — rate limit exceeded on sensitive routes.",
  "502 — upstream connector (reasoning/robot) unreachable when configured.",
] as const;

export const DEVELOPER_BILLING = {
  title: "Usage and billing",
  body: "PayPal subscriptions and balance sync through server routes when configured. API usage is org-scoped; see /pricing and /settings/billing when signed in. No usage-based billing claims on this page beyond what your plan includes.",
} as const;

export type DeveloperExample = {
  id: string;
  title: string;
  description: string;
  request: string;
  response: string;
  notes?: string;
};

export const DEVELOPER_EXAMPLES: readonly DeveloperExample[] = [
  {
    id: "health",
    title: "Health check",
    description: "Public liveness — no authentication.",
    request: `curl -s ${SITE}/api/health`,
    response: `{
  "ok": true,
  "service": "smohix-web",
  "uptime_s": 12345
}`,
  },
  {
    id: "error-budget",
    title: "Error budget summary",
    description: "Authenticated session or API key — see /docs/api.",
    request: `curl -s ${SITE}/api/overview/error-budget-summary \\
  -H "Authorization: Bearer smohix_sk_your_key_here"`,
    response: `{
  "services": [ … ],
  "summary": { "criticalBurn": 0, "warningBurn": 1 }
}`,
    notes: "Requires org-scoped API key or signed-in session.",
  },
  {
    id: "alert-ingest",
    title: "Alert ingest",
    description: "POST alert with ingest token — documented in /integrations.",
    request: `curl -s -X POST ${SITE}/api/integrations/alerts \\
  -H "Authorization: Bearer YOUR_INGEST_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"High CPU","severity":"warning","service":"api-gateway"}'`,
    response: `{ "accepted": true, "id": "…" }`,
  },
  {
    id: "dry-run",
    title: "Automation dry-run",
    description: "Simulate playbook without live execution.",
    request: `curl -s -X POST ${SITE}/api/automations/dry-run \\
  -H "Cookie: …session…" \\
  -H "Content-Type: application/json" \\
  -d '{"playbookId":"…","incidentId":"…"}'`,
    response: `{ "status": "simulated", "steps": [ … ] }`,
    notes: "Session cookie auth on console routes.",
  },
  {
    id: "copilot-stream",
    title: "Copilot chat (streaming)",
    description: "Server-side OpenAI or reasoning backend — SSE response.",
    request: `curl -s -N -X POST ${SITE}/api/copilot/chat \\
  -H "Cookie: …session…" \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"Summarize open incidents"}]}'`,
    response: `data: {"delta":"…"}\n\ndata: [DONE]`,
    notes: "Streaming format per copilot route implementation.",
  },
  {
    id: "auth-errors",
    title: "Authentication errors",
    description: "Common HTTP statuses from documented routes.",
    request: `# Missing key
curl -s -o /dev/null -w "%{http_code}" \\
  ${SITE}/api/overview/error-budget-summary`,
    response: `401 — missing or invalid API key / session
403 — org role or plan does not allow the action
429 — rate limit exceeded
502 — upstream connector unreachable`,
  },
  {
    id: "cli-planned",
    title: "CLI (planned)",
    description: "Future developer CLI — not published yet.",
    request: `# Planned
smohix health
smohix keys list
smohix ingest test --token $INGEST_TOKEN`,
    response: `# CLI status: planned — see DEVELOPER_SDKS on /developers`,
    notes: "Use curl and API keys until CLI ships.",
  },
] as const;

export const DEVELOPER_SDK_EXAMPLE = `# TypeScript — fetch with API key (server-side script)
import { readFileSync } from "node:fs";

const key = (process.env.SMOHIX_API_KEY ?? process.env.ZENTRO_API_KEY)!;
const res = await fetch("${SITE}/api/health");
console.log(await res.json());`;


export function sdkStatusLabel(status: SdkStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "preview":
      return "Preview";
    case "coming-soon":
      return "Coming soon";
    case "planned":
      return "Planned";
  }
}
