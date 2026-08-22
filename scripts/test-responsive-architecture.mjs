/**
 * Phase 27 — responsive architecture guard
 *
 * Asserts document-level horizontal overflow is zero on public routes.
 * Internal scroll containers (e.g. CodeSurface) are allowed.
 *
 * Usage:
 *   npm run build && npm run start &
 *   SMOHIX_QA_BASE_URL=http://127.0.0.1:3000 npm run test:responsive-architecture
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = (process.env.SMOHIX_QA_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", ".phase27-qa");
const CAPTURE = process.env.SMOHIX_QA_CAPTURE === "1";

const PUBLIC_ROUTES = [
  "/",
  "/products",
  "/platform",
  "/developers",
  "/docs",
  "/docs/api",
  "/pricing",
  "/security",
  "/trust",
  "/pilot",
  "/auth/sign-in",
];

const VIEWPORTS = [
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1024x900", width: 1024, height: 900 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "390x844", width: 390, height: 844 },
];

const SCREENSHOT_TARGETS = [
  { route: "/", name: "home", widths: [1440, 768, 390] },
  { route: "/products", name: "products", widths: [1440, 768, 390] },
  { route: "/docs/api", name: "docs-api", widths: [1440, 390] },
  { route: "/auth/sign-in", name: "auth", widths: [1440, 390] },
];

async function probeReachable() {
  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    try {
      const res = await fetch(BASE, { signal: AbortSignal.timeout(8000) });
      return res.ok || res.status === 304;
    } catch {
      return false;
    }
  }
}

function findOffender(pageMetrics) {
  return pageMetrics.offenders?.[0] ?? null;
}

async function measurePage(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const vw = doc.clientWidth;
    const offenders = [];

    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;

      const codeSurface = el.closest?.(".smohix-code-surface");
      if (codeSurface && codeSurface !== el) continue;

      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;

      const rightOverflow = r.right - vw;
      const leftOverflow = 0 - r.left;
      if (rightOverflow <= 2 && leftOverflow <= 2) continue;

      offenders.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        cls: String(el.className || "").slice(0, 180),
        text: (el.textContent || "").trim().slice(0, 80),
        boundingRect: {
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
          right: Math.round(r.right),
        },
        overflowRight: Math.round(Math.max(0, rightOverflow)),
        overflowLeft: Math.round(Math.max(0, leftOverflow)),
        computed: {
          width: cs.width,
          minWidth: cs.minWidth,
          maxWidth: cs.maxWidth,
          overflowX: cs.overflowX,
          whiteSpace: cs.whiteSpace,
        },
      });
    }

    offenders.sort(
      (a, b) => b.overflowRight + b.overflowLeft - (a.overflowRight + a.overflowLeft),
    );

    return {
      clientWidth: vw,
      scrollWidth: doc.scrollWidth,
      overflow: Math.max(0, doc.scrollWidth - vw),
      offenders: offenders.slice(0, 8),
    };
  });
}

async function main() {
  const reachable = await probeReachable();
  if (!reachable) {
    console.error(
      `[responsive-architecture] Server not reachable at ${BASE}. Start with: npm run build && npm run start`,
    );
    process.exit(1);
  }

  if (CAPTURE) mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    for (const route of PUBLIC_ROUTES) {
      const url = `${BASE}${route}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(400);

      const metrics = await measurePage(page);
      const entry = {
        route,
        viewport: vp.name,
        ...metrics,
        offender: findOffender(metrics),
      };
      results.push(entry);

      if (metrics.overflow > 0) {
        failures.push(entry);
        console.error(
          `[FAIL] ${route} @ ${vp.name}: clientWidth=${metrics.clientWidth} scrollWidth=${metrics.scrollWidth} overflow=${metrics.overflow}`,
        );
        if (entry.offender) {
          console.error(
            `  likely: <${entry.offender.tag}${entry.offender.id ? `#${entry.offender.id}` : ""} class="${entry.offender.cls}">`,
          );
          console.error(`  rect: ${JSON.stringify(entry.offender.boundingRect)}`);
        }
      } else {
        console.log(`[PASS] ${route} @ ${vp.name}`);
      }
    }

    if (CAPTURE) {
      for (const target of SCREENSHOT_TARGETS) {
        if (!target.widths.includes(vp.width)) continue;
        const shotRoute = target.route;
        await page.goto(`${BASE}${shotRoute}`, { waitUntil: "networkidle", timeout: 90000 });
        await page.waitForTimeout(500);
        const file = join(OUT, `${target.name}-${vp.width}.png`);
        await page.screenshot({ path: file, fullPage: false });
      }
    }

    await context.close();
  }

  await browser.close();

  if (CAPTURE) {
    writeFileSync(join(OUT, "report.json"), JSON.stringify({ base: BASE, results, failures }, null, 2));
  }

  console.log(`\n[responsive-architecture] ${results.length} checks, ${failures.length} failures`);
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
