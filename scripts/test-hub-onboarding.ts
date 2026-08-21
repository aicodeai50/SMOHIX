/**
 * Hub onboarding regression — quick start, product status, AI/docs links, no payment CTA.
 * Run: npx --yes tsx scripts/test-hub-onboarding.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FLAGSHIP_PRODUCTS, SMOHIX_WORKSPACE_URLS } from "../lib/ecosystem-workspaces";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

const hubPage = read("app/(app)/hub/page.tsx");
const onboarding = read("components/console/HubOnboardingPanel.tsx");
const quickActions = read("components/console/DashboardStats.tsx");

assert(hubPage.includes("HubOnboardingPanel"), "hub page must render HubOnboardingPanel");
assert(hubPage.includes("hasOrganization"), "hub must load organization context");
assert(hubPage.includes("orgName"), "hub must surface org name when present");

assert(onboarding.includes("Needs attention and quick start") || onboarding.includes("Organization context"), "onboarding heading");
assert(onboarding.includes("configuredWorkspace") || onboarding.includes("hasOrganization"), "configured workspace collapse path");
assert(onboarding.includes("Resources and quick links"), "configured hub collapses resources");
assert(onboarding.includes("/settings#setup-wizard"), "setup wizard quick start");
assert(onboarding.includes("/docs"), "docs quick start");
assert(onboarding.includes("/docs/api"), "API docs quick start");
assert(onboarding.includes("/settings/api-keys"), "API keys linked");
assert(onboarding.includes("/pilot"), "pilot entry");
assert(onboarding.includes("/contact"), "contact entry");
assert(onboarding.includes("/security"), "security linked");
assert(onboarding.includes("/trust"), "trust linked");
assert(onboarding.includes("/status"), "status linked");
assert(onboarding.includes("Create or join organization"), "org empty state");
assert(onboarding.includes("Open Smohix AI"), "Smohix AI hub link");
assert(onboarding.includes("SMOHIX_WORKSPACE_URLS.ai"), "AI target uses workspace AI URL");
assert(SMOHIX_WORKSPACE_URLS.ai === "https://ai.smohix.run", "AI target is ai.smohix.run");
assert(onboarding.includes('target="_blank"'), "AI opens externally");
assert(onboarding.includes("FLAGSHIP_PRODUCTS"), "product panel reuses flagship list");
assert(onboarding.includes("MaturityBadge"), "product status badges");

assert(!onboarding.includes("Subscribe — Pro"), "no Subscribe Pro CTA in hub onboarding");
assert(!onboarding.includes("Subscribe — Team"), "no Subscribe Team CTA in hub onboarding");
assert(onboarding.includes("Self-serve checkout remains deferred"), "payment deferred note");

assert(quickActions.includes("/services#svc-name"), "quick actions include add service");
assert(quickActions.includes("/copilot"), "quick actions include copilot");
assert(!quickActions.includes('label: "Billing"'), "billing shortcut removed from hub quick actions");

assert(FLAGSHIP_PRODUCTS.some((p) => p.id === "smohix-ai" && p.status === "live"), "AI live");
assert(
  FLAGSHIP_PRODUCTS.some((p) => p.id === "smohix-platform" && p.workspaceUrl === "/hub"),
  "platform open action targets hub",
);

console.log("test-hub-onboarding: all checks passed");
