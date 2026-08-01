/**
 * Developer journey content — only real routes and capabilities from this repository.
 */

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
    detail: "Open-source web app at github.com/aicodeai50/ZENTRO — primary integration surface today.",
  },
  {
    name: "TypeScript SDK",
    status: "preview",
    detail: "Documented alongside the API catalog; dedicated package publishing is in progress.",
  },
  {
    name: "Python SDK",
    status: "coming-soon",
    detail: "Planned — use REST and API keys until published.",
  },
  {
    name: "CLI",
    status: "planned",
    detail: "Planned developer CLI for keys, ingest testing, and health checks.",
  },
] as const;

export const DEVELOPER_QUICK_START = [
  {
    step: "1. Read the API catalog",
    detail: "Browse authenticated and public routes at /docs/api.",
    href: "/docs/api",
  },
  {
    step: "2. Sign in and create an API key",
    detail: "Keys use the zentro_sk_ prefix and are managed in Settings.",
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
    "Programmatic access: API keys (Authorization: Bearer zentro_sk_…).",
    "Alert ingest: dedicated ingest tokens scoped per workspace.",
    "Webhooks: PayPal signature verification server-side; never expose secrets in client code.",
  ],
} as const;

export const DEVELOPER_EXAMPLE = `// Example: authenticated API request (server or script)
const res = await fetch("https://zentro.run/api/overview/error-budget-summary", {
  headers: {
    Authorization: "Bearer zentro_sk_your_key_here",
  },
});
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const data = await res.json();`;

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
