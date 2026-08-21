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
    detail: "Planned — use the Smohix HTTP API and API keys until published.",
  },
  {
    name: "CLI",
    status: "planned",
    detail: "Planned developer CLI for keys, ingest testing, and health checks.",
  },
] as const;

/** Capability cards — only features that exist in this repository. */
export const DEVELOPER_CAPABILITIES = [
  {
    title: "REST API",
    description: "Same-origin HTTP routes for health, ingest, console operations, and connector proxies.",
    href: "/docs/api",
  },
  {
    title: "API keys",
    description:
      "Create and revoke smohix_sk_ keys for server-side calls to /api/reasoning/* and /api/robot/*.",
    href: "/auth/sign-in?next=/settings/api-keys",
  },
  {
    title: "Alert & vulnerability ingest",
    description: "Bearer ingest tokens open incidents and normalize vulnerability payloads.",
    href: "/integrations",
  },
  {
    title: "Operational integrations",
    description: "Slack approval callbacks, connector health, and signed inbound webhooks where configured.",
    href: "/integrations",
  },
  {
    title: "Audit-aware workflows",
    description: "Approvals, automations, and incident timelines record evidence for review.",
    href: "/platform",
  },
  {
    title: "Assessor API tokens",
    description: "Dedicated smohix_ca_ tokens for compliance assessor exports (separate from API keys).",
    href: "/docs/api#user",
  },
] as const;

export const DEVELOPER_NAV = [
  { href: "/developers", label: "Developers" },
  { href: "/docs/api", label: "API docs" },
  { href: "/auth/sign-in?next=/settings/api-keys", label: "API keys" },
  { href: "/platform", label: "Platform" },
  { href: "/status", label: "Status" },
  { href: SMOHIX_AI_PUBLIC_URL, label: "Smohix AI", external: true },
] as const;

export const DEVELOPER_QUICK_START = [
  {
    step: "1. Sign in",
    detail: "Create a workspace session so you can mint keys and configure ingest.",
    href: "/auth/sign-in?next=/settings/api-keys",
  },
  {
    step: "2. Create an API key",
    detail: "Settings → API keys. The full secret is shown once — copy it immediately.",
    href: "/auth/sign-in?next=/settings/api-keys",
  },
  {
    step: "3. Store the key securely",
    detail: "Use an environment variable or secret manager. Never commit keys to Git.",
    href: "/docs/api#security",
  },
  {
    step: "4. Make a supported request",
    detail:
      "Call /api/health (public) or authenticate /api/reasoning/* and /api/robot/* with Bearer smohix_sk_…",
    href: "/docs/api#proxy",
  },
  {
    step: "5. Handle errors",
    detail: "Expect 401/403 for auth, 429 when rate limited, and 5xx for upstream or server failures.",
    href: "/docs/api#errors",
  },
  {
    step: "6. Rotate or revoke keys",
    detail: "Revoke compromised keys in Settings immediately, then mint a replacement.",
    href: "/auth/sign-in?next=/settings/api-keys",
  },
] as const;

export const DEVELOPER_AUTH = {
  title: "Authentication",
  points: [
    "Browser sessions: Supabase Auth cookies on console and most product API routes.",
    "API keys: Authorization: Bearer smohix_sk_… or header X-Smohix-Api-Key for /api/reasoning/* and /api/robot/*.",
    "Alert ingest: dedicated Bearer ingest tokens (smohix_ingest_…) per workspace.",
    "Assessor access: smohix_ca_ tokens for compliance assessor routes.",
    "Provider webhooks: signature verification (PayPal, Lemon Squeezy, Slack) — never expose signing secrets in clients.",
    "Legacy key prefixes remain accepted for compatibility where implemented (see API key token helpers).",
  ],
} as const;

export const DEVELOPER_SECURITY_GUIDANCE = [
  "Store API keys server-side only (environment variables or a secret manager).",
  "Prefer least privilege: one key per integration so you can revoke without downtime elsewhere.",
  "Rotate keys after personnel changes or suspected exposure; revoke first, then replace.",
  "Call Smohix over HTTPS only (production: https://smohix.run).",
  "Never embed API keys in front-end bundles, mobile apps, or public repositories.",
] as const;

/** Primary example — uses a real API-key–authenticated path. */
export const DEVELOPER_EXAMPLE = `// Server-side only — never expose smohix_sk_ keys in browsers
const key = process.env.SMOHIX_API_KEY; // e.g. smohix_sk_example_not_a_real_secret
if (!key) throw new Error("Missing SMOHIX_API_KEY");

const res = await fetch("${SITE}/api/reasoning/health", {
  headers: {
    Authorization: \`Bearer \${key}\`,
    // or: "X-Smohix-Api-Key": key,
  },
});
if (!res.ok) {
  const body = await res.text();
  throw new Error(\`HTTP \${res.status}: \${body}\`);
}
const data = await res.json();
console.log(data);`;

export const DEVELOPER_AI_NOTE = {
  title: "Smohix AI (separate product)",
  body: `Smohix AI lives at ${SMOHIX_AI_PUBLIC_URL} and is not the same surface as this HQ HTTP catalog. Console Copilot uses same-origin /api/copilot/chat with server-side configuration — HQ API keys authenticate reasoning/robot proxies here, not the Smohix AI product site.`,
  href: SMOHIX_AI_PUBLIC_URL,
} as const;

export const DEVELOPER_ERROR_HANDLING = [
  "401 — missing or invalid session / API key / ingest token.",
  "403 — org role or plan does not allow the action.",
  "404 — resource not found (route-dependent).",
  "429 — rate limit exceeded (sensitive routes apply IP or user+IP limits).",
  "5xx — server or upstream connector failure (for example 502 when a proxy backend is unreachable).",
] as const;

export const DEVELOPER_RATE_LIMITS = {
  title: "Rate limits",
  body: "Sensitive routes enforce in-memory limits (Upstash when configured). Proxy routes typically allow 120 requests per 60 seconds per user+IP. Alert and vulnerability ingest apply similar per-IP limits. Responses may include retry_after / Retry-After when limited.",
} as const;

export const DEVELOPER_VERSIONING = {
  title: "Versioning",
  body: "HQ routes are served under /api/… without a public /v1 path segment today. Treat the catalog as the source of truth; a full versioned public API may be introduced later without inventing endpoints here.",
} as const;

export const DEVELOPER_BILLING = {
  title: "Usage and billing",
  body: "Plan and checkout behavior are documented on /pricing. Developer APIs here do not introduce self-serve payment flows. Configure billing only through existing signed-in settings when available.",
} as const;

export type DeveloperExample = {
  id: string;
  title: string;
  description: string;
  request: string;
  response: string;
  notes?: string;
  /** When true, JS/TS snippets may include an API key header. */
  usesApiKey?: boolean;
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
    usesApiKey: false,
  },
  {
    id: "reasoning-proxy",
    title: "Reasoning proxy (API key)",
    description: "Authenticate /api/reasoning/* with a Smohix API key from Settings.",
    request: `curl -s ${SITE}/api/reasoning/health \\
  -H "Authorization: Bearer smohix_sk_example_not_a_real_secret"`,
    response: `# Upstream JSON when the reasoning connector is configured
# 401 when the key is missing/invalid
# 429 when rate limited`,
    notes: "Also accepts X-Smohix-Api-Key. Requires SUPABASE_SERVICE_ROLE_KEY on the server for key validation in production.",
    usesApiKey: true,
  },
  {
    id: "alert-ingest",
    title: "Alert ingest",
    description: "POST alert with a workspace ingest token — see Integrations.",
    request: `curl -s -X POST ${SITE}/api/integrations/alerts \\
  -H "Authorization: Bearer smohix_ingest_example_not_a_real_secret" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"High CPU","severity":"warning","service":"api-gateway"}'`,
    response: `{
  "incident_id": "…",
  "duplicate": false
}`,
    notes: "HTTP 201 for new incidents; 200 when duplicate. Optional HMAC signing when configured.",
    usesApiKey: false,
  },
  {
    id: "dry-run",
    title: "Automation dry-run",
    description: "Simulate a playbook with a signed-in console session.",
    request: `curl -s -X POST ${SITE}/api/automations/dry-run \\
  -H "Cookie: …session…" \\
  -H "Content-Type: application/json" \\
  -d '{"playbookId":"…","incidentId":"…"}'`,
    response: `# Shape depends on playbook — see route handler
# Human approval remains required for guarded execution`,
    notes: "Session cookie auth on console routes — not Smohix API keys.",
    usesApiKey: false,
  },
  {
    id: "auth-errors",
    title: "Authentication errors",
    description: "Common HTTP statuses from documented routes.",
    request: `# Missing credentials on a protected proxy route
curl -s -o /dev/null -w "%{http_code}" \\
  ${SITE}/api/reasoning/health`,
    response: `401 — missing or invalid API key / session
403 — org role or plan does not allow the action
429 — rate limit exceeded
5xx — server or upstream connector failure`,
    usesApiKey: false,
  },
] as const;

export const DEVELOPER_SDK_EXAMPLE = `# TypeScript — public health check (no secret required)
const res = await fetch("${SITE}/api/health");
console.log(await res.json());

# With an API key (server-side only)
# const key = process.env.SMOHIX_API_KEY!;
# await fetch("${SITE}/api/reasoning/health", {
#   headers: { Authorization: \`Bearer \${key}\` },
# });`;

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
