/**
 * Smohix rebrand regression — branding, domains, SEO, packages, env aliases, Hub hygiene.
 * Run: npx tsx scripts/test-smohix-rebrand.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FLAGSHIP_ECOSYSTEM_PRODUCTS, COMPANY_NAME } from "../lib/company-identity";
import {
  ECOSYSTEM_PUBLIC_HOSTS,
  FLAGSHIP_PRODUCT_IDS,
  SMOHIX_WORKSPACE_URLS,
} from "../lib/ecosystem-workspaces";
import { PRODUCT_REGISTRY, SMOHIX_AI_PUBLIC_URL, validateProductRegistry } from "../lib/product-registry";
import { HEADER_ACTIONS, HEADER_NAV } from "../lib/site-nav";
import {
  SITE_COMPANY_NAME,
  SITE_MARKETING_DESCRIPTION,
  SITE_MARKETING_TITLE,
  SITE_PRIMARY_DOMAIN,
} from "../lib/site-brand";
import { getSiteUrl } from "../lib/site";
import { SITE_EMAIL_CONTACT } from "../lib/billing";
import { getShBackendApiUrl, getSmohixOwnApiUrl } from "../lib/backend-urls";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

// 1) Company branding
assert(SITE_COMPANY_NAME === "Smohix Technologies", "SITE_COMPANY_NAME");
assert(COMPANY_NAME === "Smohix Technologies", "COMPANY_NAME");
assert(SITE_PRIMARY_DOMAIN === "smohix.run", "SITE_PRIMARY_DOMAIN");
assert(SITE_MARKETING_TITLE.includes("Smohix Technologies"), "marketing title");
assert(SITE_MARKETING_DESCRIPTION.includes("smohix.run"), "marketing description domain");
assert(SITE_MARKETING_DESCRIPTION.includes("Smohix Technologies"), "marketing description company");
assert(!SITE_MARKETING_DESCRIPTION.toLowerCase().includes("zentro"), "marketing description still Zentro");

// 2) Homepage / products
assert(HEADER_ACTIONS.openAi.label === "Open Smohix AI", "Open Smohix AI CTA label");
assert(HEADER_ACTIONS.openAi.href === "https://ai.smohix.run", "Open Smohix AI URL");
assert(
  HEADER_NAV.map((n) => n.label).join(",") === "Products,Solutions,Developers,Services,Pricing,Company",
  "primary nav structure",
);

for (const name of ["Smohix AI", "Smohix Platform", "Smohix Assistant", "Smohix Log", "Smohix Identity"]) {
  assert(
    PRODUCT_REGISTRY.some((p) => p.publicName === name || p.name === name),
    `missing product label: ${name}`,
  );
}

assert(!FLAGSHIP_PRODUCT_IDS.includes("memory-pendant" as never), "Memory Pendant must not be flagship");
assert(
  !FLAGSHIP_ECOSYSTEM_PRODUCTS.some((p) => p.id === "memory-pendant"),
  "Memory Pendant not in flagship ecosystem",
);

// 3) Domains
assert(SMOHIX_WORKSPACE_URLS.headquarters === "https://smohix.run", "HQ domain");
assert(SMOHIX_WORKSPACE_URLS.platform === "https://platform.smohix.run", "platform domain");
assert(SMOHIX_WORKSPACE_URLS.ai === "https://ai.smohix.run", "ai domain");
assert(SMOHIX_WORKSPACE_URLS.assistant === "https://assistant.smohix.run", "assistant domain");
assert(SMOHIX_WORKSPACE_URLS.privateAi === "https://pri.smohix.run", "pri domain");
assert(SMOHIX_WORKSPACE_URLS.log === "https://log.smohix.run", "log domain");
assert(SMOHIX_WORKSPACE_URLS.identity === "https://identity.smohix.run", "identity domain");
assert(SMOHIX_WORKSPACE_URLS.system === "https://system.smohix.run", "system domain");
assert(SMOHIX_AI_PUBLIC_URL === "https://ai.smohix.run", "AI public URL default");

for (const host of [
  "smohix.run",
  "platform.smohix.run",
  "ai.smohix.run",
  "assistant.smohix.run",
  "pri.smohix.run",
  "log.smohix.run",
  "identity.smohix.run",
  "system.smohix.run",
]) {
  assert(ECOSYSTEM_PUBLIC_HOSTS.includes(host as (typeof ECOSYSTEM_PUBLIC_HOSTS)[number]), `allowlist ${host}`);
}

// 4) Canonical / SEO
assert(getSiteUrl() === "https://smohix.run", "canonical site URL default");
const sitemap = read("app/sitemap.ts");
assert(sitemap.includes("getSiteUrl"), "sitemap uses getSiteUrl");
assert(!sitemap.includes("zentro.run"), "sitemap must not hardcode zentro.run");

const homeJsonLd = read("components/site/HomePageJsonLd.tsx");
assert(homeJsonLd.includes("SITE_COMPANY_NAME"), "JSON-LD uses SITE_COMPANY_NAME");
assert(homeJsonLd.includes("Smohix ecosystem products"), "JSON-LD product list name");

const manifest = read("public/site.webmanifest");
assert(manifest.includes("Smohix"), "webmanifest brand");
assert(!manifest.toLowerCase().includes("zentro"), "webmanifest still Zentro");

// 5) Email
assert(SITE_EMAIL_CONTACT === "hi@smohix.run", "contact email domain");

// 6) Env compatibility aliases
delete process.env.SMOHIX_REASONING_API_URL;
process.env.ZENTRO_REASONING_API_URL = "http://legacy-reasoning.example";
assert(getShBackendApiUrl() === "http://legacy-reasoning.example", "ZENTRO reasoning fallback");
delete process.env.ZENTRO_REASONING_API_URL;
process.env.SMOHIX_REASONING_API_URL = "http://smohix-reasoning.example";
assert(getShBackendApiUrl() === "http://smohix-reasoning.example", "SMOHIX reasoning preferred");
delete process.env.SMOHIX_REASONING_API_URL;

delete process.env.REACT_APP_SMOHIX_OWN_API;
delete process.env.SMOHIX_OWN_API_URL;
process.env.REACT_APP_ZENTRO_OWN_API = "http://zentro-own-api.railway.internal";
assert(getSmohixOwnApiUrl() === "http://zentro-own-api.railway.internal", "legacy Own API env fallback");
delete process.env.REACT_APP_ZENTRO_OWN_API;

// 7) No public Hub subdomain dependency / no Railway in public registry actions
assert(validateProductRegistry().length === 0, "registry validation");
for (const p of PRODUCT_REGISTRY) {
  for (const a of p.availableActions) {
    assert(!a.href.includes("hub.smohix.run"), `${p.id}: public hub subdomain`);
    assert(!a.href.includes("hub.zentro.run"), `${p.id}: legacy hub subdomain`);
    assert(!a.href.includes("railway.internal"), `${p.id}: railway URL in action`);
  }
}

const architecture = read("lib/ecosystem-graph.ts");
assert(!architecture.includes("hub.smohix.run"), "ecosystem graph must not market hub subdomain");
assert(!architecture.includes("hub.zentro.run"), "ecosystem graph must not market legacy hub subdomain");

// 8) Package scope — this HQ app has no @zentro imports
const pkg = JSON.parse(read("package.json")) as { name: string; dependencies?: Record<string, string> };
assert(pkg.name === "smohix-web", "package name");
const depNames = Object.keys(pkg.dependencies ?? {});
assert(!depNames.some((d) => d.startsWith("@zentro/")), "no @zentro dependencies");
assert(
  !read("package-lock.json").includes('"@zentro/'),
  "package-lock must not reference @zentro packages",
);

// 9) Logo / favicon geometry unchanged (no wordmark text)
const icon = read("app/icon.svg");
assert(!/zentro|smohix/i.test(icon), "icon.svg must remain geometry-only (no brand word)");

// 10) Redirects for legacy product paths
const nextConfig = read("next.config.ts");
assert(nextConfig.includes("/products/zentro-ai"), "legacy product redirect present");
assert(nextConfig.includes("destination: \"/products/smohix-ai\""), "smohix-ai redirect target");
assert(nextConfig.includes("zentro.run"), "legacy host redirect retained temporarily");

// 11) Active marketing copy must not say Zentro (spot-check key surfaces)
for (const rel of [
  "lib/site-brand.ts",
  "lib/company-identity.ts",
  "components/landing/Hero.tsx",
  "app/company/page.tsx",
  "public/site.webmanifest",
]) {
  const body = read(rel).toLowerCase();
  // Allow documented legacy cookie / env fallback tokens only outside these files
  assert(!body.includes("zentro"), `${rel} still contains zentro`);
}

console.log("test-smohix-rebrand: all checks passed");
