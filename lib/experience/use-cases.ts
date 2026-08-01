export type UseCase = {
  id: string;
  title: string;
  problem: string;
  solution: string;
  products: readonly { slug: string; name: string }[];
  deliversNow: readonly string[];
  requiresPilot: readonly string[];
  planned: readonly string[];
  outcomes: readonly string[];
};

/** Scenario descriptions only — no invented customer names or metrics. */
export const USE_CASES: readonly UseCase[] = [
  {
    id: "healthcare",
    title: "Healthcare",
    problem:
      "Clinical and operational teams need audit trails and controlled automation without exposing PHI to ad-hoc AI tools.",
    solution:
      "Use Platform for incidents and approvals, Identity for org RBAC, and Zentro AI at ai.zentro.run with policies you configure.",
    products: [
      { slug: "zentro-platform", name: "Zentro Platform" },
      { slug: "identity", name: "Identity" },
      { slug: "zentro-ai", name: "Zentro AI" },
    ],
    deliversNow: ["Console with audit export (where enabled)", "Supabase auth and org RBAC", "Standalone Zentro AI product"],
    requiresPilot: ["Regulated rollout scoping", "Connector policy review"],
    planned: ["Expanded vertical solution packs"],
    outcomes: [
      "Human-in-the-loop before production changes",
      "Exportable audit and evidence modules (where enabled)",
      "No client-side API secrets on zentro.run",
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise",
    problem:
      "Large teams need unified command surfaces, delegated approvals, and GRC-oriented evidence without another siloed portal.",
    solution:
      "Platform console plus compliance modules (beta), Enterprise pilot path, and professional services for scoped rollouts.",
    products: [
      { slug: "zentro-platform", name: "Zentro Platform" },
      { slug: "analytics", name: "Analytics" },
      { slug: "identity", name: "Identity" },
    ],
    deliversNow: ["Incidents, approvals, audit console", "Overview metrics when signed in"],
    requiresPilot: ["Enterprise compliance module rollout", "Dedicated analytics module"],
    planned: ["Exportable executive summaries"],
    outcomes: [
      "Single sign-in across modules",
      "Approvals queue as first-class route",
      "Honest maturity labels for each capability",
    ],
  },
  {
    id: "developers",
    title: "Developers",
    problem:
      "Integrators need a stable API catalog, keys, and ingest paths — not undocumented internal URLs.",
    solution:
      "Zentro Own API catalog, API keys, alert ingest tokens, and documented proxies to optional backends.",
    products: [
      { slug: "zentro-own-api", name: "Zentro Own API" },
      { slug: "identity", name: "Identity" },
    ],
    deliversNow: ["/docs/api catalog", "GET /api/health", "API keys in Settings"],
    requiresPilot: [],
    planned: ["Published TypeScript SDK package", "Developer CLI"],
    outcomes: [
      "Documented routes at /docs/api",
      "Bearer and ingest-token auth patterns",
      "Private Railway URLs never in browser bundles",
    ],
  },
  {
    id: "internal-tools",
    title: "Internal tools",
    problem:
      "Platform teams build internal ops tools that drift from production guardrails and evidence requirements.",
    solution:
      "Extend Platform automations and Agents (prototype) with dry-runs, Slack approvals, and audit receipts.",
    products: [
      { slug: "zentro-platform", name: "Zentro Platform" },
      { slug: "agents", name: "Agents" },
    ],
    deliversNow: ["Automations console", "Dry-run API", "Audit log"],
    requiresPilot: ["Agent registry and scheduling"],
    planned: ["Multi-step agent graphs"],
    outcomes: [
      "Dry-run before live automation",
      "Blocked reasons captured in remediation flows",
      "Same audit spine as incidents",
    ],
  },
  {
    id: "knowledge-assistants",
    title: "Knowledge assistants",
    problem:
      "Operators re-explain context every shift because runbooks sit outside the incident workflow.",
    solution:
      "Runbooks module today; Knowledge product and Copilot grounding planned to connect operational context.",
    products: [
      { slug: "knowledge", name: "Knowledge" },
      { slug: "zentro-ai", name: "Zentro AI" },
      { slug: "memory-pendant", name: "Memory Pendant" },
    ],
    deliversNow: ["Runbooks module in Platform", "Zentro AI at ai.zentro.run"],
    requiresPilot: ["Memory Pendant prototype access"],
    planned: ["Unified knowledge search", "Memory Pendant integration"],
    outcomes: [
      "Runbooks linkable from incidents now",
      "Future: search and AI-grounded answers in workspace",
    ],
  },
  {
    id: "workflow-automation",
    title: "Workflow automation",
    problem:
      "Unsupervised scripts in production create blast-radius risk without simulation or approvers.",
    solution:
      "Agents and Automations with dry-run API, robot proxy, and approval notes tied to incidents.",
    products: [
      { slug: "agents", name: "Agents" },
      { slug: "zentro-platform", name: "Zentro Platform" },
    ],
    deliversNow: ["Dry-run and automations routes", "Approval queue"],
    requiresPilot: ["Production agent scheduling"],
    planned: ["First-class agent registry"],
    outcomes: [
      "Simulated vs connector modes clearly labeled",
      "Prototype agent paths documented on product page",
    ],
  },
  {
    id: "operations",
    title: "Operations",
    problem:
      "SRE and SOC teams juggle incidents, SLO burn, and connector health across disconnected dashboards.",
    solution:
      "Overview command center, hub stats, and Analytics preview — same Platform identity.",
    products: [
      { slug: "zentro-platform", name: "Zentro Platform" },
      { slug: "analytics", name: "Analytics" },
    ],
    deliversNow: ["Overview when signed in", "Error budget API where configured"],
    requiresPilot: ["Dedicated analytics module"],
    planned: ["Cross-product usage metrics"],
    outcomes: [
      "Incident and connector signals in Overview",
      "SLO profile via documented API routes",
    ],
  },
  {
    id: "education",
    title: "Education",
    problem:
      "Institutions need controlled access for teaching ops workflows without production credentials in coursework.",
    solution:
      "Product Access documentation, API request builder, and scoped pilot programs — live console via pilot only.",
    products: [
      { slug: "zentro-platform", name: "Zentro Platform" },
      { slug: "zentro-ai", name: "Zentro AI" },
    ],
    deliversNow: ["Public documentation", "ai.zentro.run product access"],
    requiresPilot: ["Scoped institutional workspace"],
    planned: [],
    outcomes: [
      "Honest availability labels for teaching materials",
      "Pilot path for scoped institutional access",
    ],
  },
  {
    id: "government",
    title: "Government",
    problem:
      "Public-sector teams require evidence, access control, and transparent product maturity for procurement review.",
    solution:
      "Trust center, audit export, Identity RBAC, and compliance modules (beta) with factual status disclosure.",
    products: [
      { slug: "zentro-platform", name: "Zentro Platform" },
      { slug: "identity", name: "Identity" },
    ],
    deliversNow: ["Trust center", "Audit export (where enabled)", "Auditor workspace role"],
    requiresPilot: ["Agency-specific compliance scoping"],
    planned: ["Cross-product SSO documentation"],
    outcomes: [
      "Trust center without unverified certification claims",
      "Auditor workspace role in console",
    ],
  },
] as const;
