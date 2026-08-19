/**
 * Zero-Zentro customer-facing regression.
 * Scans UI/docs/lib surfaces for legacy Zentro branding outside the compat allowlist.
 * Run: npx tsx scripts/test-zero-zentro.ts
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const ZENTRO_RE = /zentro/i;

/** Paths never scanned (internal compat modules). */
const SCAN_EXCLUDE_FILES = new Set([
  "lib/backend-urls.ts",
  "lib/site.ts",
  "lib/dev-tenant.ts",
  "lib/storage-migrate.ts",
]);

/** Directory roots to scan (relative to repo root). */
const SCAN_ROOTS = ["components", "app", "lib", "public"] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function normalizeRel(p: string): string {
  return p.replace(/\\/g, "/");
}

function loadAllowlist(): Set<string> {
  const docPath = path.join(root, "docs/zentro-compat-allowlist.md");
  const body = readFileSync(docPath, "utf8");
  const allowed = new Set<string>();
  for (const line of body.split("\n")) {
    const m = line.match(/^-\s+`([^`]+)`/);
    if (!m) continue;
    const entry = m[1]!.replace(/\\/g, "/");
    if (entry.includes("**")) continue;
    if (entry.endsWith("/**")) {
      const prefix = entry.slice(0, -3);
      allowed.add(prefix);
      continue;
    }
    allowed.add(entry);
  }
  return allowed;
}

function isAllowlisted(rel: string, allowlist: Set<string>): boolean {
  if (allowlist.has(rel)) return true;
  for (const entry of allowlist) {
    const prefix = entry.endsWith("/**") ? entry.slice(0, -3) : entry;
    if (rel === prefix || rel.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

function collectScanFiles(dirRel: string, acc: string[] = []): string[] {
  const abs = path.join(root, dirRel);
  let entries: string[];
  try {
    entries = readdirSync(abs);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const rel = normalizeRel(path.join(dirRel, name));
    if (name === "node_modules" || name === ".next") continue;
    const full = path.join(root, rel);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (rel === "app/api") continue;
      collectScanFiles(rel, acc);
      continue;
    }
    if (!/\.(tsx?|jsx?|md|json|svg|webmanifest)$/.test(name)) continue;
    if (SCAN_EXCLUDE_FILES.has(rel)) continue;
    acc.push(rel);
  }
  return acc;
}

function stripCompatEnvLines(content: string): string {
  return content
    .split("\n")
    .filter((line) => !/\bZENTRO_[A-Z0-9_]+\b/.test(line) || /legacy|fallback|compat|migrate|retired|stale/i.test(line))
    .join("\n");
}

function findCustomerZentro(rel: string, content: string): { line: number; text: string }[] {
  const hits: { line: number; text: string }[] = [];
  const body = stripCompatEnvLines(content);
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (!ZENTRO_RE.test(line)) continue;
    if (rel === "README.md" && /zentro_db_health/.test(line)) continue;
    if (/zentro_dev_tid/.test(line)) continue;
    if (/zentro\.hub\.|zentro\.console\.|zentro_analytics_consent/.test(line)) continue;
    hits.push({ line: i + 1, text: line.trim() });
  }
  return hits;
}

const allowlist = loadAllowlist();
const files: string[] = [];
for (const scanRoot of SCAN_ROOTS) {
  collectScanFiles(scanRoot, files);
}

const violations: { file: string; line: number; text: string }[] = [];

for (const rel of files.sort()) {
  if (isAllowlisted(rel, allowlist)) continue;
  const content = readFileSync(path.join(root, rel), "utf8");
  for (const hit of findCustomerZentro(rel, content)) {
    violations.push({ file: rel, ...hit });
  }
}

if (violations.length > 0) {
  const report = violations
    .map((v) => `  ${v.file}:${v.line}  ${v.text}`)
    .join("\n");
  throw new Error(
    `Customer-facing zentro references outside allowlist (${violations.length}):\n${report}\n\nAdd to docs/zentro-compat-allowlist.md only for true internal compat — otherwise migrate to Smohix.`,
  );
}

console.log(`test-zero-zentro: scanned ${files.length} files, 0 customer-facing zentro violations`);
