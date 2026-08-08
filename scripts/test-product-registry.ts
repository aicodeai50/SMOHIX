/**
 * Product registry and public mock-experience regression tests.
 * Run: npm run test:product-registry
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ALLOWLISTED_PUBLIC_HOSTS,
  PRODUCT_REGISTRY,
  validateProductRegistry,
  SMOHIX_AI_PUBLIC_URL,
  type ProductRegistryEntry,
  type RegistryMaturity,
} from "../lib/product-registry";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// --- Registry validation ---
const registryErrors = validateProductRegistry();
assert(registryErrors.length === 0, `validateProductRegistry failed:\n${registryErrors.join("\n")}`);

const ids = PRODUCT_REGISTRY.map((p) => p.id);
assert(new Set(ids).size === ids.length, "duplicate product IDs in registry");

assert(SMOHIX_AI_PUBLIC_URL === "https://ai.smohix.run", "SMOHIX_AI_PUBLIC_URL must be https://ai.smohix.run");

for (const p of PRODUCT_REGISTRY) {
  if (p.maturity === "planned") {
    const open = p.availableActions.some((a) => a.kind === "open_product");
    assert(!open, `${p.id}: planned products must not expose open_product action`);
  }
  if (p.maturity === "prototype" && p.availableActions.some((a) => a.kind === "open_product")) {
    assert(
      p.productUrl?.startsWith("https://") || p.id === "smohix-ai",
      `${p.id}: prototype open_product must link to real HTTPS destination`,
    );
  }
  for (const action of p.availableActions) {
    assert(
      !action.href.includes("railway.internal") && !action.href.includes(".up.railway.app"),
      `${p.id}: action "${action.label}" contains internal Railway URL`,
    );
    if (action.href.startsWith("http")) {
      const host = new URL(action.href).hostname;
      const allowed =
        ALLOWLISTED_PUBLIC_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) ||
        host.endsWith("smohix.run");
      assert(allowed, `${p.id}: action href host not allowlisted: ${host}`);
    }
  }
}

// --- Maturity-aware CTA behavior ---
function hasOpenProduct(entry: ProductRegistryEntry): boolean {
  return entry.availableActions.some((a) => a.kind === "open_product");
}

for (const p of PRODUCT_REGISTRY.filter((x) => x.maturity === "planned")) {
  assert(!hasOpenProduct(p), `${p.id}: planned product shows Open product CTA`);
}

// --- Developer examples: no API keys in static exports ---
const devJourney = readFileSync(path.join(root, "lib/developer-journey.ts"), "utf8");
assert(!devJourney.includes("zentro_sk_live_"), "developer-journey must not embed real API keys");
assert(devJourney.includes("/api/health"), "developer-journey must document health route");

// --- Status adapters: SSRF-safe patterns ---
const adapters = readFileSync(path.join(root, "lib/status/adapters.ts"), "utf8");
assert(adapters.includes("PROBE_TIMEOUT_MS"), "status adapters must define probe timeout");
assert(adapters.includes("ALLOWLISTED_PUBLIC_HOSTS"), "status adapters must use allowlist");
assert(!adapters.includes("railway.internal"), "status adapters must not reference railway.internal");

// --- No mock experience files on public routes ---
const deletedMockFiles = [
  "components/experience/ExperienceDemos.tsx",
  "components/experience/DemoFrame.tsx",
  "components/experience/PlaygroundClient.tsx",
  "lib/experience/demo-center.ts",
  "lib/experience/playground-mocks.ts",
];
for (const rel of deletedMockFiles) {
  try {
    statSync(path.join(root, rel));
    throw new Error(`mock file still exists: ${rel}`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("mock file")) throw e;
  }
}

const forbiddenPublicPhrases = [
  "Demo Center",
  "ExperienceDemos",
  "PlaygroundClient",
  "playground-mocks",
  "demo-center",
  "Mock data —",
  "fake API",
];

function collectTsxTs(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      collectTsxTs(full, acc);
    } else if (/\.(tsx|ts)$/.test(name)) {
      acc.push(full);
    }
  }
  return acc;
}

const publicDirs = [
  path.join(root, "app"),
  path.join(root, "components/products"),
  path.join(root, "components/experience"),
  path.join(root, "components/developers"),
  path.join(root, "components/status"),
  path.join(root, "lib/experience"),
].filter((d) => {
  try {
    statSync(d);
    return true;
  } catch {
    return false;
  }
});

for (const dir of publicDirs) {
  for (const file of collectTsxTs(dir)) {
    const rel = path.relative(root, file).replace(/\\/g, "/");
    if (rel.includes("/(app)/") || rel.includes("/api/")) continue;
    const content = readFileSync(file, "utf8");
    for (const phrase of forbiddenPublicPhrases) {
      assert(!content.includes(phrase), `${rel} contains forbidden public phrase: ${phrase}`);
    }
  }
}

// --- Route redirects configured ---
const nextConfig = readFileSync(path.join(root, "next.config.ts"), "utf8");
assert(nextConfig.includes('source: "/demo"'), "next.config must redirect /demo");
assert(nextConfig.includes('destination: "/products"'), "next.config must redirect /demo to /products");
assert(nextConfig.includes('source: "/tour"'), "next.config must redirect /tour");
assert(nextConfig.includes('destination: "/explore"'), "next.config must redirect /tour to /explore");

// --- Playground is example builder, not mock executor ---
const playgroundPage = readFileSync(path.join(root, "app/playground/page.tsx"), "utf8");
assert(
  playgroundPage.includes("ApiRequestBuilder") || playgroundPage.includes("request builder"),
  "playground must use API request builder",
);
assert(!playgroundPage.includes("PlaygroundClient"), "playground must not use mock PlaygroundClient");

// --- Status page sanitizer preserved ---
const statusPage = readFileSync(path.join(root, "app/status/page.tsx"), "utf8");
assert(statusPage.includes("statusView"), "status page must keep statusView sanitizer");
assert(statusPage.includes("JSON.stringify(statusView"), "status page must serialize sanitized view");

// --- Sitemap: no /status, has /explore ---
const sitemap = readFileSync(path.join(root, "app/sitemap.ts"), "utf8");
assert(!sitemap.includes('"/status"'), "sitemap must not include /status");
assert(sitemap.includes('"/explore"'), "sitemap must include /explore");
assert(!sitemap.includes('"/demo"'), "sitemap must not include /demo");

// --- Maturity labels ---
const maturities: RegistryMaturity[] = ["live", "preview", "prototype", "internal", "planned"];
for (const m of maturities) {
  assert(PRODUCT_REGISTRY.some((p) => p.maturity === m) || m === "internal", `registry covers ${m}`);
}

console.log("test-product-registry: all checks passed");
