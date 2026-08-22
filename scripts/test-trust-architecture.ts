/**
 * Phase 34 — enterprise trust architecture regression.
 * Run: npx --yes tsx scripts/test-trust-architecture.ts
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

const securityPage = read("app/security/page.tsx");
const trustPage = read("app/trust/page.tsx");
const statusPage = read("app/status/page.tsx");
const securityField = read("components/trust/SecurityBoundaryField.tsx");
const trustField = read("components/trust/TrustEvidenceField.tsx");
const assuranceRail = read("components/trust/AssuranceRail.tsx");
const trustCenter = read("lib/trust-center.ts");
const globals = read("app/globals.css");
const products = read("components/products/ProductAccessHub.tsx");
const platform = read("app/platform/page.tsx");
const developers = read("app/developers/page.tsx");
const homeHero = read("components/landing/Hero.tsx");
const docsApi = read("app/docs/api/page.tsx");

assert(securityPage.includes("SecurityBoundaryField"), "security page uses SecurityBoundaryField");
assert(trustPage.includes("TrustEvidenceField"), "trust page uses TrustEvidenceField");
assert(statusPage.includes("AssuranceRail"), "status page uses AssuranceRail");
assert(securityField.includes("AssuranceRail"), "security field links assurance rail");
assert(trustField.includes("AssuranceRail"), "trust field links assurance rail");

assert(assuranceRail.includes('href: "/security"'), "assurance rail → security");
assert(assuranceRail.includes('href: "/trust"'), "assurance rail → trust");
assert(assuranceRail.includes('href: "/status"'), "assurance rail → status");
assert(assuranceRail.includes("Controls & boundaries"), "security role label");
assert(assuranceRail.includes("Evidence & assurance"), "trust role label");
assert(assuranceRail.includes("Operational availability"), "status role label");

assert(securityField.includes("smohix-security-boundary-field"), "security field hook");
assert(securityField.includes("Identity boundary") || securityField.includes("identity"), "identity plane");
assert(securityField.includes("Data boundary") || securityField.includes("data"), "data plane");
assert(securityField.includes("Execution boundary") || securityField.includes("execution"), "execution plane");
assert(securityField.includes("Human authority") || securityField.includes("authority"), "human authority");
assert(securityField.includes("Audit boundary") || securityField.includes("audit"), "audit plane");
assert(securityField.includes("API boundary") || securityField.includes("api"), "API plane");
assert(securityField.includes("/docs/api#security"), "API security verify link");
assert(securityField.includes("/trust"), "security → trust");
assert(securityField.includes("ContactEmail"), "disclosure contact preserved");

assert(trustField.includes("smohix-trust-evidence-field"), "trust field hook");
assert(trustField.includes("TRUST_SECURITY"), "trust security evidence");
assert(trustField.includes("TRUST_PRIVACY"), "trust privacy evidence");
assert(trustField.includes("TRUST_AI"), "trust AI evidence");
assert(trustField.includes("TRUST_NOT_CLAIMED"), "non-claims preserved");
assert(trustField.includes("Not claimed"), "not claimed state text");
assert(trustField.includes("Documented") || trustField.includes("In development"), "evidence state grammar");
assert(trustField.includes("/security"), "trust → security");
assert(trustField.includes("/status"), "trust → status");
assert(trustField.includes("/privacy"), "privacy link");

assert(trustCenter.includes("SOC 2 Type II certification"), "SOC2 remains in not-claimed list");
assert(trustCenter.includes("ISO 27001 certification"), "ISO remains in not-claimed list");
assert(trustCenter.includes("HIPAA compliance or BAA"), "HIPAA remains in not-claimed list");

const forbiddenClaims = [
  "SOC 2 certified",
  "ISO 27001 certified",
  "HIPAA compliant",
  "GDPR certified",
  "zero trust certified",
  "military-grade encryption",
  "end-to-end encrypted",
  "independently audited",
  "penetration tested",
];
for (const claim of forbiddenClaims) {
  assert(!securityField.toLowerCase().includes(claim.toLowerCase()), `security must not claim: ${claim}`);
  assert(!trustField.toLowerCase().includes(claim.toLowerCase()), `trust must not claim: ${claim}`);
  assert(!securityPage.toLowerCase().includes(claim.toLowerCase()), `security page must not claim: ${claim}`);
  assert(!trustPage.toLowerCase().includes(claim.toLowerCase()), `trust page must not claim: ${claim}`);
}

assert(!trustPage.includes("mCard"), "trust page no longer uses equal marketing cards");
assert(!trustPage.includes("PILLARS"), "old pillar card grid removed from trust page");
assert(!securityPage.includes("LegalLayout"), "security left generic legal prose shell");

assert(globals.includes(".smohix-security-boundary-field"), "security CSS");
assert(globals.includes(".smohix-trust-evidence-field"), "trust CSS");
assert(globals.includes(".smohix-assurance-rail"), "assurance rail CSS");
assert(globals.includes(".smohix-trust-evidence-state"), "evidence state CSS");

assert(products.includes("ProductEcosystemField"), "products frozen");
assert(platform.includes("PlatformCoreField"), "platform frozen");
assert(developers.includes("DeveloperCoreField"), "developers frozen");
assert(homeHero.includes("SITE_COMPANY_NAME") || homeHero.includes("HQ"), "homepage frozen");
assert(docsApi.includes("EndpointRail") || docsApi.includes("authentication"), "docs api frozen");

console.log("test-trust-architecture: all checks passed");
