/**
 * Developer platform surface contracts.
 * Run: npx --yes tsx scripts/test-developer-platform.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DEVELOPER_CAPABILITIES,
  DEVELOPER_EXAMPLE,
  DEVELOPER_EXAMPLES,
  DEVELOPER_NAV,
  DEVELOPER_QUICK_START,
} from "../lib/developer-journey";
import { SMOHIX_AI_PUBLIC_URL } from "../lib/product-registry";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

const developers = read("app/developers/page.tsx");
const developerHero = read("components/developers/DeveloperHero.tsx");
const developerCore = read("components/developers/DeveloperCoreField.tsx");
const developersSurface = `${developers}\n${developerHero}\n${developerCore}`;
assert(
  developersSurface.includes("Developer Platform") || developersSurface.includes("Developer platform"),
  "developers hero",
);
assert(developersSurface.includes("/docs/api"), "developers → API docs");
assert(developersSurface.includes("/settings/api-keys"), "developers → API keys");
assert(
  developersSurface.includes("DEVELOPER_CAPABILITIES") || developersSurface.includes("What you can build"),
  "capability section",
);
assert(
  developersSurface.includes(SMOHIX_AI_PUBLIC_URL) ||
    developers.includes("DEVELOPER_AI_NOTE") ||
    developersSurface.includes("Smohix AI"),
  "Smohix AI link",
);
assert(!developersSurface.includes("Stripe"), "no Stripe payment invent");
assert(
  !/Zentro(?!_)/.test(developersSurface.replace(/zentro_sk_|zentro_ingest_|zentro_ca_/g, "")),
  "no customer Zentro brand in page",
);

assert(DEVELOPER_NAV.some((n) => n.href === "/docs/api"), "nav API docs");
assert(DEVELOPER_NAV.some((n) => n.label === "Smohix AI"), "nav Smohix AI");
assert(DEVELOPER_QUICK_START.length >= 6, "quick start steps");
assert(DEVELOPER_CAPABILITIES.every((c) => c.href.startsWith("/") || c.href.startsWith("http")), "capability hrefs");
assert(DEVELOPER_EXAMPLE.includes("smohix_sk_example") || DEVELOPER_EXAMPLE.includes("SMOHIX_API_KEY"), "fake/example key");
assert(DEVELOPER_EXAMPLE.includes("/api/reasoning"), "example uses real API-key path");
assert(!DEVELOPER_EXAMPLE.includes("error-budget-summary"), "no false Bearer example on session route");

const alertExample = DEVELOPER_EXAMPLES.find((e) => e.id === "alert-ingest");
assert(alertExample?.response.includes("incident_id"), "alert ingest response shape");

const apiDocs = read("app/docs/api/page.tsx");
assert(apiDocs.includes('id="authentication"'), "api docs auth section");
assert(apiDocs.includes('id="errors"'), "api docs errors");
assert(apiDocs.includes('id="rate-limits"'), "api docs rate limits");
assert(apiDocs.includes('id="security"'), "api docs security");
assert(apiDocs.includes('id="api-keys"'), "api docs api keys");
assert(apiDocs.includes('id="versioning"'), "api docs versioning");
assert(apiDocs.includes("not a complete published OpenAPI") || apiDocs.includes("not a full published"), "openapi sketch disclaimer");
assert(apiDocs.includes("SMOHIX_AI_PUBLIC_URL") || apiDocs.includes("ai.smohix.run"), "AI boundary on API docs");

const keysPanel = read("components/settings/ApiKeysPanel.tsx");
assert(keysPanel.includes("No API keys yet"), "empty state");
assert(keysPanel.includes("Create API key"), "create CTA");
assert(keysPanel.includes("Security guidance"), "security guidance");
assert(!keysPanel.includes("Scopes & endpoints"), "no invented scopes CTA");

const catalog = read("lib/docs/api-catalog.ts");
assert(catalog.includes("Smohix API key"), "catalog documents API key on proxy");

assert(SMOHIX_AI_PUBLIC_URL.includes("ai.smohix.run"), "AI product URL");

console.log("test-developer-platform: all checks passed");
