/**
 * Smohix HQ corporate identity regression — Flow Mark promotion checks.
 * Run: npx --yes tsx scripts/test-smohix-hq-brand.ts
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AI_APERTURE_S_PATH,
  HQ_ASSET_PATHS,
  HQ_CONCEPT_NAME,
  HQ_MICRO_S_UPPER_PATH,
  HQ_S_UPPER_PATH,
  HQ_REGISTRATION_DOT,
  LEGACY_PRECISION_PLATE_FRAME,
} from "../lib/brand/hq/geometry";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

// Concept metadata
assert(HQ_CONCEPT_NAME === "Flow Mark", "HQ concept name");
assert(HQ_S_UPPER_PATH.includes("M 72"), "upper S stroke present");
assert(HQ_REGISTRATION_DOT.r > 0, "registration dot defined");

// Custom vector S — not font glyph, not AI Aperture
assert(!HQ_S_UPPER_PATH.includes("font"), "S path must not reference fonts");
assert(!HQ_S_UPPER_PATH.includes(AI_APERTURE_S_PATH.slice(0, 20)), "HQ S must differ from AI block");

// Micro distinct from AI Aperture S
assert(!HQ_MICRO_S_UPPER_PATH.includes("a5 5 0 0 1 5 5"), "micro must not use AI rounded-square block");
assert(AI_APERTURE_S_PATH.includes("a5 5 0 0 1"), "AI reference path sanity");

// Static HQ assets exist
for (const rel of [
  "public/brand/hq/smohix-hq-mark.svg",
  "public/brand/hq/smohix-hq-domain.svg",
  "public/brand/hq/smohix-hq-micro.svg",
  "public/brand/hq/smohix-hq-micro-light.svg",
]) {
  assert(existsSync(path.join(root, rel)), `missing asset: ${rel}`);
  const svg = read(rel);
  assert(svg.includes("<svg"), `invalid svg: ${rel}`);
  assert(svg.includes('viewBox="0 0'), `missing viewBox: ${rel}`);
}

// Favicon — S symbol only, no visible text elements
const iconSvg = read("app/icon.svg");
assert(iconSvg.includes(HQ_MICRO_S_UPPER_PATH.slice(0, 12)), "app/icon.svg uses Flow Mark micro S");
assert(!/<text[\s>]/i.test(iconSvg), "favicon must not contain SVG text elements");
assert(!iconSvg.includes(".run"), "favicon must not contain .run text");
assert(iconSvg.includes("#5ee1ff") || iconSvg.includes("5ee1ff"), "favicon includes accent dot");

// brand.ts references Flow Mark
const brandTs = read("lib/brand.ts");
assert(brandTs.includes("Flow Mark") || brandTs.includes("HQ_CONCEPT_NAME"), "brand.ts references HQ concept");
assert(brandTs.includes(HQ_ASSET_PATHS.masterMark), "brand.ts uses HQ master mark URL");
assert(brandTs.includes("getBrandLogoUrl"), "brand.ts exports JSON-LD logo helper");
assert(brandTs.includes("markPng"), "JSON-LD logo uses 512px PNG mark");
assert(brandTs.includes("shortcut"), "metadata icons include shortcut favicon");

// Header/footer wired through BrandLogo → SmohixHqWordmark
const brandLogo = read("components/brand/BrandLogo.tsx");
assert(brandLogo.includes("SmohixHqWordmark"), "BrandLogo uses Flow Mark wordmark");
assert(!brandLogo.includes("SmohixMark"), "BrandLogo must not use legacy SmohixMark");
assert(!brandLogo.includes("Precision Plate"), "BrandLogo must not reference Precision Plate");

// OG / Apple use HQ OG components
assert(read("app/opengraph-image.tsx").includes("HqLockupOgContent"), "OG uses HQ lockup");
assert(read("app/apple-icon.tsx").includes("HqMicroMarkOgContent"), "Apple icon uses HQ symbol");

// Precision Plate must not appear in customer-facing runtime
const runtimeFiles = [
  "components/brand/BrandLogo.tsx",
  "app/opengraph-image.tsx",
  "app/apple-icon.tsx",
  "components/site/Header.tsx",
  "components/site/Footer.tsx",
  "components/landing/HomepageDevelopersSection.tsx",
];
for (const rel of runtimeFiles) {
  const body = read(rel);
  assert(!body.includes("Precision Plate"), `${rel} must not reference Precision Plate`);
  assert(!body.includes("HQ_FRAME_PATHS"), `${rel} must not use Precision Plate frame paths`);
  assert(!body.includes("HQ_LETTER_PATHS"), `${rel} must not use Precision Plate letter paths`);
  assert(!body.includes("SmohixMarkOgContent"), `${rel} must not use legacy OG mark`);
  assert(!body.includes('from "./SmohixMark"'), `${rel} must not import legacy SmohixMark`);
}

// Primary brand wordmark — Smohix (not smohix.run)
const wordmark = read("components/brand/hq/SmohixHqWordmark.tsx");
assert(wordmark.includes("Smohix"), "wordmark shows Smohix brand");
assert(!/>\s*\.run\s*</.test(wordmark), "primary wordmark must not render .run suffix");
assert(!wordmark.includes('color: HQ_ACCENT_COLOR }}>.run'), "primary wordmark must not use domain accent suffix");

// Domain wordmark reserved for explicit domain contexts
const domainWordmark = read("components/brand/hq/SmohixHqDomainWordmark.tsx");
assert(domainWordmark.includes(".run"), "domain wordmark includes .run suffix");
assert(domainWordmark.includes("SmohixHqDomainWordmark"), "domain wordmark component exported");

// Header logo must not render domain suffix
assert(!/>\s*\.run\s*</.test(brandLogo), "BrandLogo must not render .run domain suffix");

// Preview route remains internal-only
const previewPage = read("app/brand-preview/page.tsx");
assert(previewPage.includes("index: false"), "brand-preview must be noindex");

// Brand architecture documentation
const archDoc = read("docs/brand-architecture.md");
assert(archDoc.includes("Flow Mark"), "brand architecture documents HQ concept");
assert(archDoc.includes("Aperture S"), "brand architecture documents AI mark");
assert(!archDoc.includes("Precision Plate"), "brand architecture must not promote Precision Plate");

// Legacy frame retained only in geometry for migration reference
assert(LEGACY_PRECISION_PLATE_FRAME.topLeft.startsWith("M"), "legacy frame archived in geometry");

console.log("test-smohix-hq-brand: OK");
