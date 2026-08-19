/**
 * Smohix HQ corporate identity regression — Precision Plate promotion checks.
 * Run: npx --yes tsx scripts/test-smohix-hq-brand.ts
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AI_APERTURE_S_PATH,
  HQ_ASSET_PATHS,
  HQ_CONCEPT_NAME,
  HQ_DOMAIN_SUFFIX_PATHS,
  HQ_FRAME_PATHS,
  HQ_LETTER_PATHS,
  HQ_MICRO_PATHS,
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
assert(HQ_CONCEPT_NAME === "Precision Plate", "HQ concept name");
assert(Object.keys(HQ_LETTER_PATHS).join("") === "smohix", "letter paths spell smohix");

// Custom vector lettering
for (const [letter, d] of Object.entries(HQ_LETTER_PATHS)) {
  assert(d.length > 8, `letter path too short: ${letter}`);
  assert(!d.includes("font"), `letter path must not reference fonts: ${letter}`);
}

// Structural frame
assert(HQ_FRAME_PATHS.topLeft.startsWith("M"), "frame top-left path");
assert(HQ_FRAME_PATHS.bottomRight.includes("H137"), "frame spans wordmark width");

// Domain suffix present but optional
assert(Object.keys(HQ_DOMAIN_SUFFIX_PATHS).length === 4, "domain suffix .run letters");

// Micro-mark distinct from AI Aperture S
const microCombined = Object.values(HQ_MICRO_PATHS).join("");
assert(!microCombined.includes("a5 5 0 0 1 5 5"), "micro-mark must not use AI rounded-square block");
assert(AI_APERTURE_S_PATH.includes("a5 5 0 0 1"), "AI reference path sanity");
assert(microCombined !== AI_APERTURE_S_PATH, "HQ micro must differ from AI Aperture S path");

// Static HQ assets exist
for (const rel of [
  "public/brand/hq/smohix-hq-mark.svg",
  "public/brand/hq/smohix-hq-domain.svg",
  "public/brand/hq/smohix-hq-micro.svg",
]) {
  assert(existsSync(path.join(root, rel)), `missing asset: ${rel}`);
  const svg = read(rel);
  assert(svg.includes("<svg"), `invalid svg: ${rel}`);
  assert(svg.includes('viewBox="0 0'), `missing viewBox: ${rel}`);
}

// Live brand.ts points to Precision Plate
const brandTs = read("lib/brand.ts");
assert(brandTs.includes("Precision Plate") || brandTs.includes("HQ_CONCEPT_NAME"), "brand.ts references HQ concept");
assert(brandTs.includes(HQ_ASSET_PATHS.masterMark), "brand.ts uses HQ master mark URL");
assert(brandTs.includes("getBrandLogoUrl"), "brand.ts exports JSON-LD logo helper");

// Favicon uses HQ micro geometry
const iconSvg = read("app/icon.svg");
assert(iconSvg.includes(HQ_MICRO_PATHS.frame.slice(0, 10)), "app/icon.svg uses HQ micro frame");

// Header/footer wired through BrandLogo → HqMark
const brandLogo = read("components/brand/BrandLogo.tsx");
assert(brandLogo.includes("HqMark"), "BrandLogo uses Precision Plate HqMark");
assert(!brandLogo.includes("SmohixMark"), "BrandLogo must not use legacy SmohixMark");

// OG / Apple use HQ OG components
assert(read("app/opengraph-image.tsx").includes("HqMarkOgContent"), "OG uses HQ mark");
assert(read("app/apple-icon.tsx").includes("HqMicroMarkOgContent"), "Apple icon uses HQ micro");

// Old gradient mark must not appear in customer-facing runtime imports
const runtimeFiles = [
  "components/brand/BrandLogo.tsx",
  "app/opengraph-image.tsx",
  "app/apple-icon.tsx",
  "components/site/Header.tsx",
  "components/site/Footer.tsx",
];
for (const rel of runtimeFiles) {
  const body = read(rel);
  assert(!body.includes("SmohixMarkOgContent"), `${rel} must not use legacy OG mark`);
  assert(!body.includes('from "./SmohixMark"'), `${rel} must not import legacy SmohixMark`);
}

// Preview route remains internal-only
const previewPage = read("app/brand-preview/page.tsx");
assert(previewPage.includes("index: false"), "brand-preview must be noindex");

// Brand architecture documentation
const archDoc = read("docs/brand-architecture.md");
assert(archDoc.includes("Precision Plate"), "brand architecture documents HQ concept");
assert(archDoc.includes("Aperture S"), "brand architecture documents AI mark");

console.log("test-smohix-hq-brand: OK");
