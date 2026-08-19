export type FaqItem = { q: string; a: string };
export type FaqGroup = { id: string; title: string; items: readonly FaqItem[] };

export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    id: "products",
    title: "Products",
    items: [
      {
        q: "What products are live today?",
        a: "Smohix Platform, Smohix AI (ai.smohix.run), Smohix Own API, and Smohix Identity are live. Analytics and Agents are preview/prototype. Projects and Knowledge are planned or prototype — see Product Access at /products.",
      },
      {
        q: "Does the site simulate products?",
        a: "No. Smohix.run links to real products, documentation, and console routes. The API request builder at /playground generates copyable examples only — it does not execute requests.",
      },
      {
        q: "How do I try live functionality?",
        a: "Use Product Access at /products to open live destinations, sign in to the console, or apply for a pilot at /pilot.",
      },
    ],
  },
  {
    id: "developers",
    title: "Developers",
    items: [
      {
        q: "Where is the API reference?",
        a: "Full catalog at /docs/api — routes mirror handlers in this repository.",
      },
      {
        q: "How do I authenticate API requests?",
        a: "Browser: Supabase session cookies. Scripts: Authorization: Bearer smohix_sk_… Smohix API keys. Ingest: dedicated ingest tokens per route docs.",
      },
      {
        q: "Is there a public health check?",
        a: "Yes — GET /api/health returns JSON ok, service name, and uptime when reachable.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    items: [
      {
        q: "Where are plans documented?",
        a: "See /pricing for current plan structure. Billing uses PayPal when configured server-side.",
      },
      {
        q: "Is usage-based billing advertised?",
        a: "We only describe billing that is implemented — see /developers and /pricing; sign in to /settings/billing for your org.",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        q: "How do I report a vulnerability?",
        a: "Use the security contact on /security. We do not publish unverified certification claims on /trust.",
      },
      {
        q: "Where are secrets stored?",
        a: "Server environment variables only — never in client bundles or public repos.",
      },
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise",
    items: [
      {
        q: "Do you offer pilots?",
        a: "Yes — scoped pilot programs via /pilot with honest availability labels.",
      },
      {
        q: "Are compliance modules production-ready?",
        a: "Many GRC modules are beta in the console. Status is disclosed per module in Trust center and product pages.",
      },
    ],
  },
  {
    id: "pilots",
    title: "Pilots",
    items: [
      {
        q: "What does a pilot include?",
        a: "Scoped workspace access, defined success criteria, and professional services optional — see /pilot.",
      },
      {
        q: "How do I apply?",
        a: "Submit the contact form at /contact?inquiry=pilot or use the pilot page CTA.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    items: [
      {
        q: "Where is the privacy policy?",
        a: "/privacy describes data handling for the public site and console.",
      },
      {
        q: "Does analytics require consent?",
        a: "When NEXT_PUBLIC_ANALYTICS_REQUIRES_CONSENT is set, the consent banner gates optional analytics events.",
      },
    ],
  },
] as const;
