/**
 * Single source of truth for public HTTP API reference (/docs/api).
 * Update when adding or changing route handlers under app/api.
 */
export type ApiOperation = {
  method: string;
  path: string;
  summary: string;
  auth?: string;
  notes?: string;
};

export type ApiGroup = {
  id: string;
  title: string;
  description?: string;
  operations: ApiOperation[];
};

export const API_GROUPS: ApiGroup[] = [
  {
    id: "health",
    title: "Health",
    description: "Liveness for load balancers; no auth.",
    operations: [
      { method: "GET", path: "/api/health", summary: "JSON ok, uptime, optional deploy commit." },
      { method: "HEAD", path: "/api/health", summary: "Same as GET without body." },
    ],
  },
  {
    id: "incidents",
    title: "Incidents",
    operations: [
      {
        method: "GET",
        path: "/api/incidents/{id}/export",
        summary: "Download incident as Markdown (authenticated Supabase user).",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    operations: [
      {
        method: "POST",
        path: "/api/integrations/alerts",
        summary: "Create or dedupe incident from monitoring (Bearer alert ingest token).",
        auth: "Bearer ingest token",
        notes:
          "Paid-gated per deployment; validates token server-side. Supports normalized Shynvo payload, Datadog, Prometheus/Grafana Alertmanager, PagerDuty, and New Relic payloads (vendor-specific dedupe keys). Optional HMAC signature check via SHYNVO_ALERT_WEBHOOK_SIGNING_SECRET.",
      },
      {
        method: "GET",
        path: "/api/connectors/status",
        summary: "Probe configured reasoning/automation connector URLs.",
        auth: "None (public probe from server)",
      },
    ],
  },
  {
    id: "automations",
    title: "Automations",
    operations: [
      {
        method: "POST",
        path: "/api/automations/dry-run",
        summary: "Run playbook dry-run; may persist and append audit when configured.",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "copilot",
    title: "Copilot",
    operations: [
      {
        method: "POST",
        path: "/api/copilot/chat",
        summary: "Streaming or JSON chat completion.",
        auth: "Session cookie",
      },
      { method: "GET", path: "/api/copilot/threads", summary: "List conversation threads.", auth: "Session cookie" },
      {
        method: "POST",
        path: "/api/copilot/threads",
        summary: "Create thread.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/copilot/threads/{id}/messages",
        summary: "List messages in a thread.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/copilot/threads/{id}/messages",
        summary: "Append user message and run assistant turn.",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "user",
    title: "User-scoped keys",
    operations: [
      {
        method: "GET",
        path: "/api/user/api-keys",
        summary: "List API keys (metadata).",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/user/api-keys",
        summary: "Create API key (returns plaintext once).",
        auth: "Session cookie",
      },
      {
        method: "DELETE",
        path: "/api/user/api-keys/{id}",
        summary: "Revoke key.",
        auth: "Session cookie",
      },
      {
        method: "GET",
        path: "/api/user/alert-ingest-tokens",
        summary: "List alert ingest tokens.",
        auth: "Session cookie",
      },
      {
        method: "POST",
        path: "/api/user/alert-ingest-tokens",
        summary: "Create ingest token (returns secret once).",
        auth: "Session cookie",
      },
      {
        method: "DELETE",
        path: "/api/user/alert-ingest-tokens/{id}",
        summary: "Revoke ingest token.",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "proxy",
    title: "Connector proxies",
    description: "Forward to SHYNVO_REASONING_API_URL and SHYNVO_ROBOT_API_URL when set.",
    operations: [
      {
        method: "GET|POST|PUT|PATCH|DELETE",
        path: "/api/reasoning/*",
        summary: "Proxy to reasoning backend.",
        auth: "Session cookie",
      },
      {
        method: "GET|POST|PUT|PATCH|DELETE",
        path: "/api/robot/*",
        summary: "Proxy to automation robot backend.",
        auth: "Session cookie",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    operations: [
      {
        method: "POST",
        path: "/api/webhooks/lemonsqueezy",
        summary: "Lemon Squeezy subscription webhook.",
        auth: "Webhook signature (Lemon)",
      },
    ],
  },
];
