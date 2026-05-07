import { SITE_BRAND_NAME } from "@/lib/site-brand";

export type DemoScene = {
  id: string;
  title: string;
  durationMin: string;
  route: string;
  /** Lucide icon name — resolved in the client tour */
  icon: "sparkles" | "layout-grid" | "bar-chart" | "alert" | "workflow" | "shield" | "plug" | "book";
  do: string[];
  say: string[];
};

export const DEMO_SCENES: DemoScene[] = [
  {
    id: "hook",
    title: "Hook — problem and promise",
    durationMin: "0:20",
    route: "/",
    icon: "sparkles",
    do: [
      "Start on the marketing home page at 1280×720 or 1920×1080.",
      "Scroll slowly through hero and one proof section.",
    ],
    say: [
      `Teams need guardrails when automation touches production. ${SITE_BRAND_NAME} pairs incidents, approvals, and audit so changes stay accountable.`,
    ],
  },
  {
    id: "hub",
    title: "Enter the console",
    durationMin: "0:25",
    route: "/hub",
    icon: "layout-grid",
    do: [
      "Sign in (or use local dev without Supabase if you are demoing offline mode).",
      "Land on Hub and pause on the module grid so viewers see scope.",
    ],
    say: [
      "From Hub you reach overview, incidents, services, automations, approvals, governance, and settings — one shell for operations.",
    ],
  },
  {
    id: "overview",
    title: "Operational picture",
    durationMin: "0:35",
    route: "/overview",
    icon: "bar-chart",
    do: [
      "Open Overview and highlight error budget or summary widgets relevant to your deployment.",
    ],
    say: [
      "Overview surfaces burn and triage signals so leaders and operators share the same picture before anyone executes work.",
    ],
  },
  {
    id: "incidents",
    title: "Incidents end-to-end",
    durationMin: "1:00",
    route: "/incidents",
    icon: "alert",
    do: [
      "Open Incidents list, click one incident or create a short example.",
      "Show timeline, status, and optional export or evidence actions available in your environment.",
    ],
    say: [
      "Incidents tie monitoring signals to ownership and narrative — exports support reviews and evidence packs when the database is wired.",
    ],
  },
  {
    id: "automations",
    title: "Guarded automations",
    durationMin: "0:45",
    route: "/automations",
    icon: "workflow",
    do: [
      "Open Automations, select a playbook if present, run or describe dry-run then guarded execution paths.",
    ],
    say: [
      "Dry-run and policy checks exist to block risky execution — we log what happened for audit, not just the UI state.",
    ],
  },
  {
    id: "approvals",
    title: "Approvals and governance",
    durationMin: "0:40",
    route: "/approvals",
    icon: "shield",
    do: [
      "Show a pending approval or create a low-risk example; approve or deny once.",
      "Optional: open Governance → Policies for policy blocks or suggestions if configured.",
    ],
    say: [
      "Human approval stays in the loop where policy requires it; audits capture who decided and when.",
    ],
  },
  {
    id: "connectors",
    title: "Integrations and keys",
    durationMin: "0:35",
    route: "/settings/connectors",
    icon: "plug",
    do: [
      "Open Settings → Connectors or API keys; show connector health or token surfaces without revealing secrets on screen.",
    ],
    say: [
      "Reasoning and robot backends proxy same-origin; alert ingest and API keys stay server-side — viewers should never see live tokens in a recording.",
    ],
  },
  {
    id: "api",
    title: "Close — docs and API",
    durationMin: "0:20",
    route: "/docs/api",
    icon: "book",
    do: [
      "Open public docs or HTTP API reference in a new tab; scroll the group list briefly.",
    ],
    say: [
      `Full route catalog lives under Docs — start at ${SITE_BRAND_NAME} docs API for integration planning.`,
    ],
  },
];
