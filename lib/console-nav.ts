import type { ConsoleModuleIconName } from "@/components/icons/AppIcon";

/** Shared console navigation — hub + module shortcuts. */
export const CONSOLE_MODULES: readonly {
  href: string;
  label: string;
  description: string;
  icon: ConsoleModuleIconName;
  live: boolean;
}[] = [
  {
    href: "/hub",
    label: "Platform",
    description: "Home",
    icon: "layoutDashboard",
    live: true,
  },
  {
    href: "/vision",
    label: "Vision",
    description: "Roadmap",
    icon: "telescope",
    live: true,
  },
  {
    href: "/overview",
    label: "Overview",
    description: "Command center",
    icon: "gauge",
    live: true,
  },
  {
    href: "/copilot",
    label: "Copilot",
    description: "AI triage",
    icon: "bot",
    live: true,
  },
  {
    href: "/incidents",
    label: "Incidents",
    description: "Track & resolve",
    icon: "alertTriangle",
    live: true,
  },
  {
    href: "/services",
    label: "Services",
    description: "Catalog & alerts",
    icon: "server",
    live: true,
  },
  {
    href: "/assets/certificates",
    label: "Certificates",
    description: "Expiry inventory",
    icon: "shieldCheck",
    live: true,
  },
  {
    href: "/assets/secrets",
    label: "Secrets",
    description: "Rotation posture",
    icon: "keyRound",
    live: true,
  },
  {
    href: "/assets/network",
    label: "Network",
    description: "Device inventory",
    icon: "server",
    live: true,
  },
  {
    href: "/resilience/backups",
    label: "Backups",
    description: "DR readiness",
    icon: "scrollText",
    live: true,
  },
  {
    href: "/changes",
    label: "Changes",
    description: "Calendar",
    icon: "workflow",
    live: true,
  },
  {
    href: "/governance/access",
    label: "Access",
    description: "MFA posture",
    icon: "shieldCheck",
    live: true,
  },
  {
    href: "/automations",
    label: "Automations",
    description: "Playbooks",
    icon: "workflow",
    live: true,
  },
  {
    href: "/runbooks",
    label: "Runbooks",
    description: "Procedures",
    icon: "bookOpen",
    live: true,
  },
  {
    href: "/approvals",
    label: "Approvals",
    description: "Human gates",
    icon: "shieldCheck",
    live: true,
  },
  {
    href: "/audit",
    label: "Audit",
    description: "Compliance log",
    icon: "scrollText",
    live: true,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Hub",
    icon: "settings",
    live: true,
  },
  {
    href: "/settings/billing",
    label: "Billing",
    description: "Plan",
    icon: "creditCard",
    live: true,
  },
  {
    href: "/settings/api-keys",
    label: "API keys",
    description: "Integrate",
    icon: "keyRound",
    live: true,
  },
  {
    href: "/settings/connectors",
    label: "Connectors",
    description: "Services",
    icon: "plug2",
    live: true,
  },
] as const;
