/**
 * Phase 32 — platform spatial composition regression.
 * Run: npx --yes tsx scripts/test-platform-spatial-composition.ts
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

const page = read("app/platform/page.tsx");
const hero = read("components/platform/PlatformHero.tsx");
const core = read("components/platform/PlatformCoreField.tsx");
const control = read("components/platform/PlatformControlLayer.tsx");
const surface = read("components/platform/PlatformSurfaceMap.tsx");
const globals = read("app/globals.css");
const products = read("components/products/ProductAccessHub.tsx");
const homeHero = read("components/landing/Hero.tsx");

assert(page.includes("PlatformCoreField"), "platform page composes core field");
assert(page.includes("PlatformControlLayer"), "platform page composes control layer");
assert(page.includes("PlatformHero"), "platform page composes hero");
assert(!page.includes("MarketingQuantumShell"), "quantum shell removed from platform page");

assert(hero.includes("Platform overview — then Hub when you sign in"), "hero title preserved");
assert(hero.includes("Sign in to Hub"), "primary CTA preserved");
assert(hero.includes("SmohixHorizon"), "hero uses horizon");
assert(hero.includes("ai.smohix.run"), "AI separation cue preserved");

assert(core.includes("smohix-platform-core-field"), "core field css hook");
assert(core.includes("Operations layer"), "operations layer present");
assert(core.includes("Intelligence layer"), "intelligence layer present");
assert(core.includes("Governance layer"), "governance layer present");
assert(core.includes("Developers & integrations"), "developer layer present");
assert(core.includes("/auth/sign-in?next=/incidents"), "incidents link preserved");
assert(core.includes("/docs/api"), "api docs link preserved");
assert(!core.includes("LivingPulse"), "no living pulse in core field");

assert(control.includes("What you manage inside Platform"), "control layer heading preserved");
assert(control.includes("Organizations"), "organizations capability preserved");

assert(!surface.includes("LivingPulse"), "living pulse removed from surface map");
assert(!surface.includes("smohix-eyebrow-cyber"), "cyber eyebrow removed");
assert(!surface.includes("Module map"), "equal module grid removed");
assert(surface.includes("Next IT capabilities"), "roadmap content preserved");
assert(surface.includes("Vendor integrations roadmap"), "vendor roadmap preserved");

assert(globals.includes(".smohix-platform-core-field"), "platform core css present");
assert(globals.includes(".smohix-platform-layer"), "platform layer css present");
assert(globals.includes(".smohix-platform-control-layer"), "control layer css present");

assert(products.includes("ProductEcosystemField"), "products page unchanged");
assert(homeHero.includes("SMOHIX TECHNOLOGIES HQ") || homeHero.includes("SITE_COMPANY_NAME"), "homepage hero untouched");

console.log("test-platform-spatial-composition: all checks passed");
