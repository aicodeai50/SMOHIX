/**
 * Ensures lib/docs/api-catalog.ts documents every HTTP handler under app/api (route.ts files).
 * Run from the web package root: node scripts/verify-api-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const API_ROOT = path.join(WEB_ROOT, "app", "api");
const CATALOG_PATH = path.join(WEB_ROOT, "lib", "docs", "api-catalog.ts");

/** @param {string[]} segments relative to app/api (dir containing route.ts) */
function segmentsToCatalogPath(segments) {
  const catchAllIdx = segments.findIndex((s) => s.startsWith("[[") && s.endsWith("]]"));
  if (catchAllIdx !== -1) {
    const prefix = segments.slice(0, catchAllIdx).join("/");
    return `/api/${prefix}/*`;
  }
  const norm = segments
    .map((s) => {
      if (s.startsWith("[") && s.endsWith("]")) return "{id}";
      return s;
    })
    .join("/");
  return `/api/${norm}`;
}

/** @param {string} filePath absolute path to route.ts */
function routeFileToCatalogPath(filePath) {
  const dir = path.dirname(filePath);
  const rel = path.relative(API_ROOT, dir);
  if (!rel || rel.startsWith("..")) {
    throw new Error(`Route file outside app/api: ${filePath}`);
  }
  const segments = rel.split(path.sep).filter(Boolean);
  return segmentsToCatalogPath(segments);
}

/** @param {string} src */
function extractExportedHttpMethods(src) {
  const methods = new Set();
  const fnRe = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\b/g;
  let m;
  while ((m = fnRe.exec(src))) {
    methods.add(m[1]);
  }
  const constRe = /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\s*=/g;
  while ((m = constRe.exec(src))) {
    methods.add(m[1]);
  }
  return [...methods];
}

/** @param {string} ts */
function parseCatalogOperations(ts) {
  const ops = [];
  const re = /method:\s*"([^"]+)"\s*,\s*path:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(ts))) {
    ops.push({ rawMethod: m[1], path: m[2] });
  }
  return ops;
}

/** @param {string} raw e.g. GET|POST */
function expandMethods(raw) {
  return raw.split("|").map((s) => s.trim()).filter(Boolean);
}

/**
 * @param {string} method
 * @param {string} path
 * @param {{ rawMethod: string, path: string }[]} catalogOps
 */
function catalogCovers(method, path, catalogOps) {
  for (const op of catalogOps) {
    if (op.path !== path) continue;
    const ms = expandMethods(op.rawMethod);
    if (ms.includes(method)) return true;
  }
  return false;
}

/**
 * @param {string} method
 * @param {string} path
 * @param {{ path: string, methods: string[] }[]} discovered
 */
function discoveryCovers(method, path, discovered) {
  for (const d of discovered) {
    if (d.path !== path) continue;
    if (d.methods.includes(method)) return true;
  }
  return false;
}

function walkRouteFiles(dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) {
    return out;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walkRouteFiles(p));
    } else if (ent.name === "route.ts") {
      out.push(p);
    }
  }
  return out;
}

function main() {
  const catalogSrc = fs.readFileSync(CATALOG_PATH, "utf8");
  const catalogOps = parseCatalogOperations(catalogSrc);
  if (catalogOps.length === 0) {
    console.error("verify-api-catalog: could not parse any operations from api-catalog.ts");
    process.exit(1);
  }

  /** @type {{ path: string, methods: string[] }[]} */
  const discovered = [];
  for (const file of walkRouteFiles(API_ROOT)) {
    const p = routeFileToCatalogPath(file);
    const src = fs.readFileSync(file, "utf8");
    const methods = extractExportedHttpMethods(src);
    if (methods.length === 0) {
      console.error(`verify-api-catalog: no exported HTTP handlers in ${path.relative(WEB_ROOT, file)}`);
      process.exit(1);
    }
    discovered.push({ path: p, methods });
  }

  const errors = [];

  for (const d of discovered) {
    for (const method of d.methods) {
      if (!catalogCovers(method, d.path, catalogOps)) {
        errors.push(`Undocumented route: ${method} ${d.path} (add to lib/docs/api-catalog.ts)`);
      }
    }
  }

  for (const op of catalogOps) {
    for (const method of expandMethods(op.rawMethod)) {
      if (!discoveryCovers(method, op.path, discovered)) {
        errors.push(`Stale catalog entry (no matching route): ${method} ${op.path}`);
      }
    }
  }

  if (errors.length) {
    console.error("verify-api-catalog failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
    process.exit(1);
  }

  console.log(
    `verify-api-catalog: OK (${discovered.length} route file(s), ${catalogOps.length} catalog operation(s))`,
  );
}

main();
