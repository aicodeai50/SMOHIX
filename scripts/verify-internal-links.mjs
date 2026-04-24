import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const SOURCE_DIRS = ["app", "components"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORED_PREFIXES = ["/auth/sign-in?next=", "/auth/sign-up?next=", "/#", "#", "mailto:", "tel:"];

function stripRouteGroups(value) {
  return value.replace(/\/\([^/]+\)/g, "");
}

function toRoutePath(filePath) {
  const rel = path.relative(path.join(root, "app"), filePath).replace(/\\/g, "/");
  const routeStem = rel.replace(/(^|\/)(page|route)\.(t|j)sx?$/, "");
  const cleaned = stripRouteGroups(`/${routeStem}`).replace(/\/+/g, "/");
  return cleaned === "/" ? "/" : cleaned.replace(/\/$/, "");
}

function routePatternToRegex(routePath) {
  const escaped = routePath
    .split("/")
    .map((segment) => {
      if (!segment) return "";
      if (/^\[\.\.\..+\]$/.test(segment)) return ".+";
      if (/^\[\[\.{3}.+\]\]$/.test(segment)) return ".*";
      if (/^\[.+\]$/.test(segment)) return "[^/]+";
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return new RegExp(`^${escaped || "/"}$`);
}

async function listFilesRecursive(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(abs)));
      continue;
    }
    files.push(abs);
  }
  return files;
}

function normalizeHref(href) {
  const trimmed = href.trim();
  if (!trimmed.startsWith("/")) return null;
  if (IGNORED_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) return null;
  if (trimmed.startsWith("//")) return null;
  const withoutHash = trimmed.split("#")[0];
  const withoutQuery = withoutHash.split("?")[0];
  return withoutQuery || "/";
}

function extractStaticHrefs(content) {
  const matches = [];
  const regexes = [
    /href\s*=\s*"([^"]+)"/g,
    /href\s*=\s*'([^']+)'/g,
    /href\s*=\s*\{\s*"([^"]+)"\s*\}/g,
    /href\s*=\s*\{\s*'([^']+)'\s*\}/g,
  ];
  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(content)) != null) {
      const href = match[1];
      if (href.includes("${")) continue;
      matches.push(href);
    }
  }
  return matches;
}

async function main() {
  const appFiles = await listFilesRecursive(path.join(root, "app"));
  const routeFiles = appFiles.filter((f) => /\/(page|route)\.(t|j)sx?$/.test(f.replace(/\\/g, "/")));
  const routePatterns = routeFiles.map((filePath) => {
    const routePath = toRoutePath(filePath);
    return { routePath, regex: routePatternToRegex(routePath) };
  });

  const sourceFiles = [];
  for (const srcDir of SOURCE_DIRS) {
    const dir = path.join(root, srcDir);
    const files = await listFilesRecursive(dir);
    sourceFiles.push(
      ...files.filter((f) => SOURCE_EXTENSIONS.has(path.extname(f))),
    );
  }

  const failures = [];
  for (const sourceFile of sourceFiles) {
    const content = await readFile(sourceFile, "utf8");
    const hrefs = extractStaticHrefs(content);
    for (const href of hrefs) {
      const target = normalizeHref(href);
      if (!target) continue;
      const found = routePatterns.some((pattern) => pattern.regex.test(target));
      if (!found) {
        failures.push({
          file: path.relative(root, sourceFile).replace(/\\/g, "/"),
          href,
        });
      }
    }
  }

  if (failures.length > 0) {
    console.error("verify-internal-links: FAILED");
    for (const failure of failures) {
      console.error(`- ${failure.file}: missing route for href="${failure.href}"`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`verify-internal-links: OK (${routePatterns.length} route patterns checked)`);
}

main().catch((error) => {
  console.error(`verify-internal-links: FAILED\n${error.message}`);
  process.exitCode = 1;
});
