/**
 * Phase 33 — developer spatial composition regression.
 * Run: npx --yes tsx scripts/test-developer-spatial-composition.ts
 */

import { readFileSync } from "node:fs";
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

const page = read("app/developers/page.tsx");
const hero = read("components/developers/DeveloperHero.tsx");
const core = read("components/developers/DeveloperCoreField.tsx");
const docsApi = read("app/docs/api/page.tsx");
const globals = read("app/globals.css");
const codeSurface = read("components/architecture/CodeSurface.tsx");
const products = read("components/products/ProductAccessHub.tsx");
const platform = read("app/platform/page.tsx");
const homeHero = read("components/landing/Hero.tsx");

assert(page.includes("DeveloperHero"), "developers page uses DeveloperHero");
assert(page.includes("DeveloperCoreField"), "developers page uses DeveloperCoreField");
assert(page.includes("Developer platform") || hero.includes("Developer platform"), "developer platform label");
assert(page.includes("What you can build") || core.includes("What you can build today"), "capabilities heading");
assert(page.includes("DEVELOPER_AI_NOTE") || page.includes("Smohix AI"), "AI boundary");
assert(page.includes("/settings/api-keys") || hero.includes("/settings/api-keys"), "API keys path");
assert(page.includes("/docs/api") || hero.includes("/docs/api"), "API docs path");

assert(core.includes("smohix-developer-core-field"), "core field hook");
assert(core.includes("Request lifecycle") || core.includes("lifecycle"), "lifecycle present");
assert(core.includes("Authentication architecture") || core.includes("auth-arch"), "auth architecture");
assert(core.includes("EndpointRail") || core.includes("endpoint"), "endpoint architecture");
assert(core.includes("smohix_sk_"), "API key truth");
assert(core.includes("subscribe to events") || core.includes("Not available"), "no fake outbound webhooks");
assert(core.includes("/api/health"), "real health endpoint");
assert(!core.includes("smohix_sk_live_"), "no live secrets");

assert(docsApi.includes("SmohixHorizon"), "docs api system header");
assert(docsApi.includes("EndpointRail"), "docs api endpoint rails");
assert(docsApi.includes('id="authentication"'), "auth section preserved");
assert(docsApi.includes('id="webhooks"'), "webhooks section preserved");

assert(globals.includes(".smohix-developer-core-field"), "developer css");
assert(globals.includes(".smohix-endpoint-rail"), "endpoint rail css");
assert(codeSurface.includes("context"), "code surface context prop");

assert(products.includes("ProductEcosystemField"), "products frozen");
assert(platform.includes("PlatformCoreField"), "platform frozen");
assert(homeHero.includes("SITE_COMPANY_NAME") || homeHero.includes("HQ"), "homepage frozen");

console.log("test-developer-spatial-composition: all checks passed");
