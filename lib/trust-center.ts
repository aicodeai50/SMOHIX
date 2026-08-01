/**
 * Trust center content — truthful only; no unverified certifications.
 */

export type TrustStatus = "current" | "in-progress" | "planned";

export type TrustItem = {
  title: string;
  body: string;
  status: TrustStatus;
};

export function trustStatusLabel(status: TrustStatus): string {
  switch (status) {
    case "current":
      return "Current";
    case "in-progress":
      return "In progress";
    case "planned":
      return "Planned";
  }
}

export const TRUST_SECURITY: readonly TrustItem[] = [
  {
    title: "Server-side secrets",
    body: "API keys, PayPal credentials, and private backend URLs are environment variables — never committed or sent to the browser.",
    status: "current",
  },
  {
    title: "Authentication",
    body: "Supabase Auth protects console routes. API keys (zentro_sk_) and alert ingest tokens scope programmatic access.",
    status: "current",
  },
  {
    title: "Row-level security",
    body: "Workspace data is scoped via Supabase RLS and org membership roles.",
    status: "current",
  },
  {
    title: "Webhook verification",
    body: "PayPal and ingest routes verify signatures or tokens where applicable.",
    status: "current",
  },
  {
    title: "Rate limiting",
    body: "Sensitive and public API routes use token-bucket limits (Upstash when configured, in-memory fallback).",
    status: "current",
  },
  {
    title: "Formal penetration testing",
    body: "Not claimed on this site. Engagements can be discussed through enterprise and security contact.",
    status: "planned",
  },
] as const;

export const TRUST_PRIVACY: readonly TrustItem[] = [
  {
    title: "Data boundaries",
    body: "Workspace data stays in your Supabase project context. Connector URLs point to backends you configure.",
    status: "current",
  },
  {
    title: "Privacy policy",
    body: "Published at /privacy — describes collection, cookies, and contact rights.",
    status: "current",
  },
  {
    title: "Cookie consent banner",
    body: "Optional analytics on zentro.run use a consent banner when NEXT_PUBLIC_ANALYTICS_REQUIRES_CONSENT is enabled. Essential forms work without analytics consent.",
    status: "current",
  },
  {
    title: "Data residency options",
    body: "Deployment profiles and retention controls exist in settings; full residency productization is planned.",
    status: "in-progress",
  },
] as const;

export const TRUST_AI: readonly TrustItem[] = [
  {
    title: "Human-in-the-loop",
    body: "High-impact automation routes through approval gates — Copilot assists, it does not bypass governance.",
    status: "current",
  },
  {
    title: "Grounded context",
    body: "Copilot uses same-origin APIs and optional reasoning backends — not uncontrolled external tool execution.",
    status: "current",
  },
  {
    title: "Offline fallback",
    body: "When no model is configured, Copilot returns guided offline replies instead of failing silently.",
    status: "current",
  },
  {
    title: "Memory and agent lineage",
    body: "Audit-friendly memory lineage is planned with Memory Pendant — not available today.",
    status: "planned",
  },
] as const;

export const TRUST_MATURITY = {
  title: "Product maturity disclosure",
  body: "Every product and capability on zentro.run carries an honest label: Live, Preview, Prototype, or Coming soon. We do not present roadmap items as generally available.",
  status: "current" as const,
};

export const TRUST_NOT_CLAIMED = [
  "SOC 2 Type II certification",
  "ISO 27001 certification",
  "HIPAA compliance or BAA",
  "Regulatory approval",
  "Guaranteed uptime SLAs on this marketing site",
  "Customer logos or usage statistics we have not published",
] as const;
