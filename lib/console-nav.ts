import type { ConsoleModuleIconName } from "@/components/icons/AppIcon";

export type ConsoleModuleMaturity = "core" | "beta" | "internal" | "planned";

/** Shared console navigation — hub + module shortcuts. */
export const CONSOLE_MODULES: readonly {
  href: string;
  label: string;
  description: string;
  icon: ConsoleModuleIconName;
  live: boolean;
  maturity: ConsoleModuleMaturity;
}[] = [
  {
    href: "/hub",
    label: "Hub",
    description: "Workspace home",
    icon: "layoutDashboard",
    live: true,
    maturity: "core",
  },
  {
    href: "/overview",
    label: "Overview",
    description: "Command center",
    icon: "gauge",
    live: true,
    maturity: "core",
  },
  {
    href: "/incidents",
    label: "Incidents",
    description: "Track & resolve",
    icon: "alertTriangle",
    live: true,
    maturity: "core",
  },
  {
    href: "/services",
    label: "Services",
    description: "Catalog & alerts",
    icon: "server",
    live: true,
    maturity: "core",
  },
  {
    href: "/automations",
    label: "Automations",
    description: "Playbooks",
    icon: "workflow",
    live: true,
    maturity: "core",
  },
  {
    href: "/approvals",
    label: "Approvals",
    description: "Human gates",
    icon: "shieldCheck",
    live: true,
    maturity: "core",
  },
  {
    href: "/audit",
    label: "Audit",
    description: "Evidence log",
    icon: "scrollText",
    live: true,
    maturity: "core",
  },
  {
    href: "/runbooks",
    label: "Runbooks",
    description: "Procedures",
    icon: "bookOpen",
    live: true,
    maturity: "core",
  },
  {
    href: "/copilot",
    label: "Copilot",
    description: "AI triage",
    icon: "bot",
    live: true,
    maturity: "beta",
  },
  {
    href: "/governance/compliance",
    label: "Compliance",
    description: "Evidence mapping",
    icon: "scrollText",
    live: true,
    maturity: "beta",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Account & billing",
    icon: "settings",
    live: true,
    maturity: "core",
  },
] as const;
