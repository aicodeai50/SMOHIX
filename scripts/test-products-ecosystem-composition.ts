/**
 * Phase 31B — products ecosystem spatial composition regression.
 * Run: npx --yes tsx scripts/test-products-ecosystem-composition.ts
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

const hub = read("components/products/ProductAccessHub.tsx");
const ecosystem = read("components/products/ProductEcosystemField.tsx");
const infra = read("components/products/ProductInfrastructureField.tsx");
const productsPage = read("app/products/page.tsx");
const globals = read("app/globals.css");

assert(hub.includes("ProductEcosystemField"), "ProductAccessHub must compose ecosystem field");
assert(hub.includes("ProductInfrastructureField"), "ProductAccessHub must compose infrastructure field");
assert(!hub.includes("smohix-product-constellation"), "generic constellation grid removed from hub");

assert(ecosystem.includes("getRegistryProduct"), "ecosystem field must use registry source of truth");
assert(ecosystem.includes("smohix-ecosystem-field"), "ecosystem field reuses homepage spatial grid");
assert(ecosystem.includes("smohix-platform"), "platform node present");
assert(ecosystem.includes("smohix-ai"), "AI node present");
assert(ecosystem.includes("smohix-assistant"), "assistant node present");
assert(ecosystem.includes("private-ai"), "PRI node present");
assert(!ecosystem.includes("description:"), "must not duplicate inline product descriptions");

assert(infra.includes("getAllRegistryProducts"), "infra field reads full registry");
assert(infra.includes("isFlagshipProduct"), "infra field excludes flagship duplicates");
assert(infra.includes("smohix-product-infra-field"), "infra field uses architecture planes");

assert(productsPage.includes("SmohixHorizon"), "products hero uses horizon");
assert(productsPage.includes("Smohix Technologies products"), "products title preserved");
assert(productsPage.includes("Flagship workspaces and platform capabilities"), "products lede preserved");

assert(globals.includes(".smohix-product-ecosystem-field"), "ecosystem field css present");
assert(globals.includes(".smohix-product-infra-field"), "infra field css present");
assert(!globals.includes(".smohix-product-constellation"), "old card constellation css removed");

const homepageConstellation = read("components/landing/EcosystemConstellation.tsx");
assert(homepageConstellation.includes("FLAGSHIP_PRODUCTS"), "homepage constellation unchanged source");
assert(existsSync(path.join(root, "components/landing/EcosystemConstellation.tsx")), "homepage constellation file exists");

console.log("test-products-ecosystem-composition: all checks passed");
