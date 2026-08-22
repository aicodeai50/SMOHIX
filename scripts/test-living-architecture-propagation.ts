/**
 * Phase 21 Living Architecture propagation contracts.
 * Run: npx --yes tsx scripts/test-living-architecture-propagation.ts
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

assert(existsSync(path.join(root, "components/architecture/StateBeacon.tsx")), "StateBeacon");
assert(existsSync(path.join(root, "components/architecture/CodeSurface.tsx")), "CodeSurface");
assert(existsSync(path.join(root, "lib/architecture/ops-state.ts")), "ops-state");

const ops = read("lib/architecture/ops-state.ts");
assert(ops.includes("Healthy burn"), "burn states");
assert(ops.includes("investigating"), "incident status mapping");
assert(ops.includes("denied"), "approval denied (not rejected)");
assert(!ops.includes('"open"'), "must not invent open status");
assert(!ops.includes('"rejected"'), "must not invent rejected");

const globals = read("app/globals.css");
assert(globals.includes(".smohix-beacon"), "beacon css");
assert(globals.includes(".smohix-code-surface"), "code surface css");
assert(globals.includes(".smohix-human-authority"), "human authority");
assert(globals.includes(".smohix-copilot-env"), "copilot env");
assert(globals.includes(".smohix-temporal-"), "temporal depth");

assert(read("app/(app)/incidents/page.tsx").includes("StateBeacon"), "incidents list beacon");
assert(read("app/(app)/services/page.tsx").includes("burnStateBeacon"), "services burn beacon");
assert(read("app/(app)/approvals/page.tsx").includes("smohix-human-authority"), "approvals authority");
assert(read("components/copilot/CopilotChat.tsx").includes("smohix-copilot-env"), "copilot env");
assert(read("components/landing/MarketingQuantumShell.tsx").includes("IntelligenceField"), "quantum shell replaced");
assert(!read("components/landing/MarketingQuantumShell.tsx").includes("CosmicNebula"), "nebula removed from shell");
assert(read("components/auth/AuthCard.tsx").includes("SmohixHorizon"), "auth horizon");
assert(read("app/auth/layout.tsx").includes("IntelligenceField"), "auth layout field");
assert(!read("components/auth/AuthCard.tsx").includes("IntelligenceField"), "auth card no double field");
const developersPage = read("app/developers/page.tsx");
const developerHero = read("components/developers/DeveloperHero.tsx");
const developerCore = read("components/developers/DeveloperCoreField.tsx");
const developersSurface = `${developersPage}\n${developerHero}\n${developerCore}`;
assert(developersSurface.includes("SmohixHorizon"), "developers horizon");
assert(developersSurface.includes("CodeSurface"), "developers code surface");
assert(developersSurface.includes("StateBeacon"), "developers state beacon");
assert(read("app/docs/api/page.tsx").includes("SmohixHorizon"), "docs api horizon");
assert(read("app/docs/api/page.tsx").includes("CodeSurface"), "docs api code surface");
assert(read("app/docs/api/page.tsx").includes("EndpointRail"), "docs api endpoint rails");

console.log("test-living-architecture-propagation: all checks passed");
