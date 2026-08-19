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
import { getCanonicalUrl, getSiteUrl } from "../lib/site";
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

for (const name of [
  "Smohix AI",
  "Smohix Platform",
  "Smohix Assistant",
  "Smohix PRI",
  "Smohix Log",
  "Smohix Identity",
  "Smohix Own API",
]) {
  assert(
    PRODUCT_REGISTRY.some((p) => p.publicName === name || p.name === name),
    `missing product label: ${name}`,
  );
}

assert(
  FLAGSHIP_PRODUCT_IDS.join(",") === "smohix-ai,smohix-platform,smohix-assistant,private-ai",
  "flagship hierarchy ids",
);
assert(
  FLAGSHIP_ECOSYSTEM_PRODUCTS.every((p) => p.name !== "Private AI"),
  "flagship must use Smohix PRI public name",
);
assert(
  FLAGSHIP_ECOSYSTEM_PRODUCTS.some((p) => p.id === "private-ai" && p.name === "Smohix PRI"),
  "Smohix PRI must be flagship",
);

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
assert(getCanonicalUrl("/") === "https://smohix.run/", "homepage canonical must use trailing slash");
assert(getCanonicalUrl("/about") === "https://smohix.run/about", "about canonical");
assert(getCanonicalUrl("/products") === "https://smohix.run/products", "products canonical");

const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
process.env.NEXT_PUBLIC_SITE_URL = "https://zentro.run";
assert(getSiteUrl() === "https://smohix.run", "stale zentro.run env must not leak into SEO origin");
assert(getCanonicalUrl("/") === "https://smohix.run/", "stale zentro.run env must not leak into homepage canonical");
process.env.NEXT_PUBLIC_SITE_URL = "https://www.zentro.run/";
assert(getSiteUrl() === "https://smohix.run", "www.zentro.run env must remap to smohix.run");
if (prevSite !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prevSite;
else delete process.env.NEXT_PUBLIC_SITE_URL;

const sitemap = read("app/sitemap.ts");
assert(sitemap.includes("getSiteUrl"), "sitemap uses getSiteUrl");
assert(!sitemap.includes("zentro.run"), "sitemap must not hardcode zentro.run");

const rootLayout = read("app/layout.tsx");
assert(rootLayout.includes("PRODUCTION_SITE_URL") || rootLayout.includes("getCanonicalUrl"), "root layout must pin production SEO origin");
assert(
  !/https?:\/\/zentro\.run/.test(rootLayout),
  "root layout must not hardcode zentro.run URLs",
);
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

// 9) Favicon uses HQ micro geometry (no embedded brand word text)
const icon = read("app/icon.svg");
assert(!/zentro|smohix/i.test(icon), "icon.svg must remain geometry-only (no brand word)");
assert(icon.includes("M4 26V8H21"), "icon.svg must use HQ micro-mark frame geometry");

// 10) Redirects for legacy product paths
const nextConfig = read("next.config.ts");
assert(nextConfig.includes("/products/zentro-ai"), "legacy product redirect present");
assert(nextConfig.includes("destination: \"/products/smohix-ai\""), "smohix-ai redirect target");
assert(nextConfig.includes("zentro.run"), "legacy host redirect retained temporarily");

// 11) Active marketing copy must not say Zentro (spot-check key surfaces)
const CUSTOMER_ZENTRO_RE = /(?:x-zentro-|X-Zentro-|zentro_sk_|zentro_ca_|zentro_ingest_)/i;

const integrationSurfaces = [
  "lib/developer-journey.ts",
  "lib/ecosystem-graph.ts",
  "components/settings/ApiKeysPanel.tsx",
  "app/(app)/settings/connectors/page.tsx",
  "lib/docs/api-catalog.ts",
  "components/landing/HomepageDevelopersSection.tsx",
];

const marketingSurfaces = [
  "lib/site-brand.ts",
  "lib/company-identity.ts",
  "components/landing/Hero.tsx",
  "app/company/page.tsx",
  "public/site.webmanifest",
];

for (const rel of integrationSurfaces) {
  assert(!CUSTOMER_ZENTRO_RE.test(read(rel)), `${rel} still contains customer-facing zentro integration branding`);
}

for (const rel of marketingSurfaces) {
  const body = read(rel).toLowerCase();
  assert(!body.includes("zentro"), `${rel} still contains zentro`);
}

console.log("test-smohix-rebrand: all checks passed");
