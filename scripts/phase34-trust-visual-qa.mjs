/**
 * Phase 34 — local trust architecture visual QA + screenshots
 * Run: SMOHIX_QA_BASE_URL=http://127.0.0.1:3000 node scripts/phase34-trust-visual-qa.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = (process.env.SMOHIX_QA_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", ".phase34-qa");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 1000 },
  { name: "1280", width: 1280, height: 900 },
  { name: "1024", width: 1024, height: 900 },
  { name: "768", width: 768, height: 1024 },
  { name: "430", width: 430, height: 932 },
  { name: "390", width: 390, height: 844 },
  { name: "375", width: 375, height: 812 },
];

const SCREENSHOTS = [
  { route: "/security", widths: [1440, 1024, 768, 390] },
  { route: "/trust", widths: [1440, 1024, 768, 390] },
  { route: "/status", widths: [1440, 390] },
];

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      overflow: Math.max(0, doc.scrollWidth - doc.clientWidth),
    };
  });
}

async function main() {
  const report = {
    base: BASE,
    timestamp: new Date().toISOString(),
    overflow: [],
    overflowFailures: [],
    composition: {},
    screenshots: [],
  };

  const browser = await chromium.launch({ headless: true });

  for (const route of ["/security", "/trust", "/status"]) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await ctx.newPage();
      await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(600);
      const m = await measureOverflow(page);
      report.overflow.push({ route, viewport: vp.name, ...m });
      if (m.overflow > 0) report.overflowFailures.push({ route, viewport: vp.name, ...m });

      if (vp.width === 1440) {
        report.composition[route] = await page.evaluate((r) => {
          const text = document.body?.innerText ?? "";
          return {
            assuranceRail: !!document.querySelector(".smohix-assurance-rail"),
            securityField:
              r === "/security" ? !!document.querySelector(".smohix-security-boundary-field") : true,
            trustField:
              r === "/trust" ? !!document.querySelector(".smohix-trust-evidence-field") : true,
            notClaimed: r === "/trust" ? /Not claimed/i.test(text) && /SOC 2/i.test(text) : true,
            noFakeTelemetry: !/Threats blocked|99\.999%|0 vulnerabilities/i.test(text),
            noCertClaim: !/SOC 2 certified|ISO 27001 certified|HIPAA compliant/i.test(text),
          };
        }, route);
      }
      await ctx.close();
    }
  }

  for (const target of SCREENSHOTS) {
    const label = target.route.replace("/", "") || "home";
    for (const width of target.widths) {
      const height = width >= 1024 ? 1000 : width >= 768 ? 1024 : 844;
      const ctx = await browser.newContext({ viewport: { width, height } });
      const page = await ctx.newPage();
      await page.goto(`${BASE}${target.route}`, { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(500);
      const shot = join(OUT, `${label}-${width}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      report.screenshots.push(shot);
      await ctx.close();
    }
  }

  await browser.close();
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (report.overflowFailures.length) {
    console.error("OVERFLOW FAILURES", report.overflowFailures.length);
    process.exit(1);
  }
  for (const [route, comp] of Object.entries(report.composition)) {
    for (const [k, v] of Object.entries(comp)) {
      if (!v) {
        console.error("COMPOSITION FAIL", route, k);
        process.exit(1);
      }
    }
  }
  console.log("phase34-trust-visual-qa: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
