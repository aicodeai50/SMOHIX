/**
 * Auth path protection regression — governance + existing console prefixes.
 * Run: npx --yes tsx scripts/test-auth-protected-paths.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isProtectedPath, PROTECTED_PREFIXES } from "../lib/auth/paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

assert(PROTECTED_PREFIXES.includes("/governance"), "governance prefix registered");
assert(PROTECTED_PREFIXES.includes("/hub"), "hub remains protected");
assert(PROTECTED_PREFIXES.includes("/settings"), "settings remains protected");

assert(isProtectedPath("/governance"), "anonymous /governance is protected");
assert(isProtectedPath("/governance/compliance"), "nested compliance protected");
assert(isProtectedPath("/governance/compliance/type-ii"), "deep nested governance protected");
assert(isProtectedPath("/governance/policies"), "governance policies protected");
assert(isProtectedPath("/governance/third-party-risk"), "third-party risk protected");
assert(isProtectedPath("/governance/access"), "governance access protected");

assert(isProtectedPath("/hub"), "hub protected");
assert(isProtectedPath("/services"), "services protected");
assert(isProtectedPath("/copilot"), "copilot protected");
assert(isProtectedPath("/settings/connectors"), "settings child protected");

assert(!isProtectedPath("/"), "homepage stays public");
assert(!isProtectedPath("/products"), "products stays public");
assert(!isProtectedPath("/pricing"), "pricing stays public");
assert(!isProtectedPath("/docs"), "docs stays public");
assert(!isProtectedPath("/docs/api"), "api docs stays public");
assert(!isProtectedPath("/auth/sign-in"), "sign-in stays public");
assert(!isProtectedPath("/platform"), "marketing platform stays public");
assert(!isProtectedPath("/pilot"), "pilot stays public");
assert(!isProtectedPath("/security"), "security marketing stays public");
assert(!isProtectedPath("/api/health"), "health stays public");

const proxy = read("proxy.ts");
assert(proxy.includes("isProtectedPath"), "proxy uses shared isProtectedPath");
assert(proxy.includes('url.pathname = "/auth/sign-in"'), "anonymous redirect to sign-in");
assert(proxy.includes('searchParams.set("next"'), "next= preserves original route");

console.log("test-auth-protected-paths: all checks passed");
