/**
 * Living Architecture 2050 primitive contracts.
 * Run: npx --yes tsx scripts/test-living-architecture.ts
 */

import { readFileSync, existsSync } from "node:fs";
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

const globals = read("app/globals.css");
assert(globals.includes("--la-horizon"), "horizon token");
assert(globals.includes("--la-grid"), "spatial grid token");
assert(globals.includes(".smohix-spatial-grid"), "spatial grid utility");
assert(globals.includes(".smohix-horizon"), "horizon utility");
assert(globals.includes(".smohix-intelligence-field"), "intelligence field utility");
assert(globals.includes(".smohix-surface"), "surface utility");
assert(globals.includes(".smohix-instrument-rail"), "instrument rail utility");
assert(globals.includes("prefers-reduced-motion"), "reduced motion support");

const primitives = [
  "components/architecture/SmohixSurface.tsx",
  "components/architecture/SmohixHorizon.tsx",
  "components/architecture/IntelligenceField.tsx",
  "components/architecture/CommandSection.tsx",
  "components/architecture/SystemLabel.tsx",
  "components/architecture/CoordinateDivider.tsx",
];
for (const rel of primitives) {
  assert(existsSync(path.join(root, rel)), `missing ${rel}`);
}

const hero = read("components/landing/Hero.tsx");
assert(hero.includes("SmohixHorizon"), "hero horizon");
assert(hero.includes("IntelligenceField"), "hero field");
assert(hero.includes("smohix-spatial-grid"), "hero spatial grid");

const hub = read("app/(app)/hub/page.tsx");
assert(hub.includes("Command environment") || hub.includes("CommandSection"), "hub command env");
assert(hub.includes("SmohixSurface") || hub.includes("CommandSection"), "hub surfaces");

const shell = read("components/app/AppShell.tsx");
assert(shell.includes("smohix-instrument-rail"), "shell instrument rail");

const panel = read("components/app/ConsolePanel.tsx");
assert(panel.includes("smohix-surface"), "console panel surface");

console.log("test-living-architecture: all checks passed");
