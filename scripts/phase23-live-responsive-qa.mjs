/**
 * Phase 23 live responsive smoke — Playwright viewport checks against production.
 * Public routes only. Reports overflow heuristics.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.SMOHIX_LIVE_URL ?? "https://smohix.run";
const PATHS = [
  "/",
  "/products",
  "/platform",
  "/developers",
  "/docs/api",
  "/security",
  "/trust",
  "/pricing",
  "/auth/sign-in",
];

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const rows = [];

  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: devices["Desktop Chrome"].userAgent,
      });
      const page = await context.newPage();
      for (const path of PATHS) {
        const notes = [];
        let overflowX = 0;
        let ok = true;
        try {
          const res = await page.goto(`${BASE}${path}`, {
            waitUntil: "domcontentloaded",
            timeout: 45000,
          });
          if (!res || res.status() >= 400) {
            ok = false;
            notes.push(`HTTP ${res?.status() ?? "none"}`);
          }
          await page.waitForTimeout(400);
          overflowX = await page.evaluate(() => {
            const doc = document.documentElement;
            return Math.max(0, doc.scrollWidth - doc.clientWidth);
          });
          if (overflowX > 2) {
            ok = false;
            notes.push(`horizontal overflow ${overflowX}px`);
          }
          const clipped = await page.evaluate(() => {
            const h1 = document.querySelector("h1");
            if (!h1) return false;
            const r = h1.getBoundingClientRect();
            return r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2);
          });
          if (clipped) {
            ok = false;
            notes.push("h1 clipped horizontally");
          }
        } catch (err) {
          ok = false;
          notes.push(err instanceof Error ? err.message : String(err));
        }
        rows.push({ path, viewport: vp.name, ok, overflowX, notes });
        console.log(
          `${ok ? "PASS" : "FAIL"} ${vp.name} ${path}${notes.length ? ` — ${notes.join("; ")}` : ""}`,
        );
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const failed = rows.filter((r) => !r.ok);
  console.log(`\nSUMMARY ${rows.length - failed.length}/${rows.length} pass`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
