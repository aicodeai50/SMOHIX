/**
 * Site hierarchy, navigation, SEO, and safe public copy regression tests.
 * Run: npm run test:site-hierarchy
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMPANY_MISSION,
  FLAGSHIP_ECOSYSTEM_PRODUCTS,
} from "../lib/company-identity";
import {
  FLAGSHIP_PRODUCT_IDS,
  PRIMARY_SITE_NAV,
  SMOHIX_WORKSPACE_URLS,
} from "../lib/ecosystem-workspaces";
import { PRODUCT_REGISTRY, validateProductRegistry } from "../lib/product-registry";
import { HEADER_NAV, HEADER_ACTIONS } from "../lib/site-nav";
import { getAllSolutionSlugs, getSolutionPage } from "../lib/solutions-content";
import { SITE_MARKETING_DESCRIPTION, SITE_MARKETING_TITLE } from "../lib/site-brand";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// --- Registry still valid with new workspace products ---
assert(validateProductRegistry().length === 0, "product registry validation failed");

for (const id of FLAGSHIP_PRODUCT_IDS) {
  assert(PRODUCT_REGISTRY.some((p) => p.id === id), `missing flagship registry entry: ${id}`);
}

assert(
  !FLAGSHIP_PRODUCT_IDS.includes("memory-pendant" as (typeof FLAGSHIP_PRODUCT_IDS)[number]),
  "Memory Pendant must not be a flagship product",
);

// --- Primary navigation IA ---
const navLabels = HEADER_NAV.map((n) => n.label);
assert(
  navLabels.join(",") === "Products,Platform,Developers,Enterprise,Pricing,Pilot",
  `unexpected HEADER_NAV: ${navLabels.join(", ")}`,
);

for (const item of PRIMARY_SITE_NAV) {
  assert(item.href.startsWith("/"), `nav href must be internal: ${item.href}`);
}

assert(HEADER_ACTIONS.openAi.href === SMOHIX_WORKSPACE_URLS.ai, "Open Smohix AI must link to ai.smohix.run");
assert(HEADER_ACTIONS.signIn.href === "/auth/sign-in", "Sign in action must point to auth");

// --- Company mission ---
assert(
  COMPANY_MISSION.includes("intelligent software"),
  "company mission must reflect broad technology company positioning",
);

// --- Flagship ecosystem list ---
assert(FLAGSHIP_ECOSYSTEM_PRODUCTS.length === 4, "homepage JSON-LD flagship list should have 4 products");
assert(
  !FLAGSHIP_ECOSYSTEM_PRODUCTS.some((p) => p.id === "memory-pendant"),
  "Memory Pendant must not appear in flagship ecosystem list",
);

// --- Healthcare solution includes Memory Pendant accurately ---
const healthcare = getSolutionPage("healthcare");
assert(healthcare !== undefined, "healthcare solution page required");
assert(
  healthcare.relatedProjects?.some((p) => p.name === "Memory Pendant"),
  "healthcare solution must reference Memory Pendant as a project",
);
assert(
  healthcare.relatedProjects?.[0]?.note?.includes("Not a certified medical device"),
  "healthcare must disclaim medical device certification",
);

// --- Solution slugs in sitemap source ---
const sitemap = readFileSync(path.join(root, "app/sitemap.ts"), "utf8");
for (const slug of getAllSolutionSlugs()) {
  assert(sitemap.includes("getAllSolutionSlugs"), "sitemap must include solution slugs helper");
  assert(getSolutionPage(slug) !== undefined, `solution content missing: ${slug}`);
}

// --- SEO metadata ---
assert(SITE_MARKETING_TITLE.includes("Smohix Technologies"), "marketing title must name the company");
assert(
  !SITE_MARKETING_DESCRIPTION.toLowerCase().includes("demo"),
  "marketing description must not use demo wording",
);

// --- Safe copy: no provider routing or internal env names on key public pages ---
const publicScanFiles = [
  "lib/company-identity.ts",
  "components/landing/Hero.tsx",
  "app/company/page.tsx",
  "lib/solutions-content.ts",
  "app/developers/page.tsx",
];

const forbidden = [
  "Groq",
  "Ollama",
  "REACT_APP_",
  "NEXT_PUBLIC_",
  "railway.internal",
  ".up.railway.app",
  "flagship Memory Pendant",
  "Railway",
];

for (const rel of publicScanFiles) {
  const text = readFileSync(path.join(root, rel), "utf8");
  for (const phrase of forbidden) {
    assert(!text.includes(phrase), `${rel} contains forbidden public phrase: ${phrase}`);
  }
}

// --- Logo unchanged (brand re-export only) ---
const logo = readFileSync(path.join(root, "components/site/Logo.tsx"), "utf8");
assert(logo.includes("@/components/brand"), "Logo must re-export official BrandLogo");
assert(!logo.includes("<svg"), "Logo must not contain inline alternate mark SVG");

console.log("test-site-hierarchy: all checks passed");
