/**
 * Platform structure regression — grouped nav, product switcher, badge policy.
 * Run: npx --yes tsx scripts/test-platform-structure.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONSOLE_MANAGE_LINKS,
  CONSOLE_MODULES,
  CONSOLE_NAV_GROUPS,
  groupModulesForNav,
  shouldShowModuleBadge,
} from "../lib/console-nav";
import { getConsoleBreadcrumbs } from "../lib/console-breadcrumbs";
import { SMOHIX_WORKSPACE_URLS } from "../lib/ecosystem-workspaces";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

assert(
  CONSOLE_NAV_GROUPS.map((g) => g.id).join(",") === "home,operations,knowledge,intelligence,manage",
  "nav groups order",
);
assert(CONSOLE_MODULES.every((m) => Boolean(m.group)), "every module has a nav group");
assert(!shouldShowModuleBadge("core"), "core modules must not show badges");
assert(shouldShowModuleBadge("beta"), "beta modules may show badges");

const grouped = groupModulesForNav([...CONSOLE_MODULES]);
assert(
  grouped.some((g) => g.id === "home" && g.modules.some((m) => m.href === "/hub")),
  "home group includes hub",
);
assert(
  grouped.some((g) => g.id === "operations" && g.modules.some((m) => m.href === "/incidents")),
  "operations group includes incidents",
);
assert(
  CONSOLE_MANAGE_LINKS.some((l) => l.href === "/settings/connectors"),
  "manage links integrations",
);
assert(
  CONSOLE_MANAGE_LINKS.some((l) => l.href === "/settings/api-keys"),
  "manage links api keys",
);

const crumbs = getConsoleBreadcrumbs("/incidents");
assert(crumbs[0]?.label === "Operations", "incident breadcrumbs start with Operations");
assert(
  crumbs.some((c) => c.label === "Incidents"),
  "incident breadcrumbs include Incidents",
);

const shell = read("components/app/AppShell.tsx");
assert(shell.includes("ProductWorkspaceSwitcher"), "shell has product switcher");
assert(shell.includes("IntelligenceExternalLinks"), "shell surfaces AI/Assistant/PRI");
assert(shell.includes("CONSOLE_MANAGE_LINKS"), "shell has manage links");
assert(!shell.includes('maturity === "core" ? "Core"'), "shell should not label Core badges");
assert(shell.includes("shouldShowModuleBadge"), "shell uses badge policy");

const navPanel = read("components/app/ConsoleNavPanel.tsx");
assert(!navPanel.includes("Go back in browser history"), "back control removed");
assert(!navPanel.includes("Go forward in browser history"), "forward control removed");
assert(navPanel.includes("CONSOLE_NAV_GROUPS"), "jump menu uses groups");

const switcher = read("components/app/ProductWorkspaceSwitcher.tsx");
assert(switcher.includes("SMOHIX_WORKSPACE_URLS.ai"), "switcher links Smohix AI");
assert(switcher.includes("SMOHIX_WORKSPACE_URLS.assistant"), "switcher links Assistant");
assert(switcher.includes("SMOHIX_WORKSPACE_URLS.privateAi"), "switcher links PRI");
assert(SMOHIX_WORKSPACE_URLS.ai === "https://ai.smohix.run", "AI URL canonical");
assert(switcher.includes("preview"), "preview status respected");

const connection = read("components/copilot/ConnectionStatus.tsx");
assert(
  !connection.includes("add OPENAI_API_KEY") && !connection.includes("REACT_APP_SH_BACKEND_API"),
  "copilot status hides env-var setup instructions",
);
assert(connection.includes("Configure Copilot"), "copilot offers configure CTA");
assert(
  connection.includes("Advanced reasoning isn't configured") || connection.includes("Copilot can draft"),
  "product language present",
);

const ingest = read("components/settings/AlertIngestPanel.tsx");
assert(!ingest.includes("SUPABASE_SERVICE_ROLE_KEY"), "services ingest softens env copy");
assert(ingest.includes("Configure integration"), "ingest points to integrations");
assert(ingest.includes("No monitoring connections yet"), "ingest empty state improved");

assert(!shell.includes("Subscribe — Pro"), "no payment CTA in shell");
assert(!connection.includes("Subscribe"), "no payment CTA in copilot status");

console.log("test-platform-structure: all checks passed");
