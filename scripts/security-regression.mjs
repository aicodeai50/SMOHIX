import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function read(relativePath) {
  const abs = path.join(root, relativePath);
  return readFile(abs, "utf8");
}

async function main() {
  const healthRoute = await read("app/api/health/route.ts");
  const connectorsStatusRoute = await read("app/api/connectors/status/route.ts");
  const operationalHeaders = await read("lib/security/operational-headers.ts");
  const connectorsPage = await read("app/(app)/settings/connectors/page.tsx");
  const statusPage = await read("app/status/page.tsx");
  const rootLayout = await read("app/layout.tsx");
  let rootProxyOrMiddleware = "";
  try {
    rootProxyOrMiddleware = await read("proxy.ts");
  } catch {
    rootProxyOrMiddleware = await read("middleware.ts");
  }
  const siteLib = await read("lib/site.ts");
  const siteBrandLib = await read("lib/site-brand.ts");
  const robots = await read("app/robots.ts");
  const sitemap = await read("app/sitemap.ts");
  const apiCatalog = await read("lib/docs/api-catalog.ts");
  const guardedPublicFiles = [
    "app/status/page.tsx",
    "app/api/health/route.ts",
    "app/api/connectors/status/route.ts",
    "app/(app)/settings/connectors/page.tsx",
    "lib/docs/api-catalog.ts",
  ];
  const forbiddenPublicTokens = [
    "railway_deployment_id",
    "railway_replica_id",
    "RAILWAY_DEPLOYMENT_ID",
    "RAILWAY_REPLICA_ID",
    "RAILWAY_ENVIRONMENT_NAME",
    "RAILWAY_GIT_COMMIT_SHA",
    "VERCEL_GIT_COMMIT_SHA",
  ];

  // /api/health should not expose deployment fingerprint fields.
  assert(!healthRoute.includes("RAILWAY_DEPLOYMENT_ID"), "health route leaks deployment ID source");
  assert(!healthRoute.includes("RAILWAY_REPLICA_ID"), "health route leaks replica ID source");
  assert(!healthRoute.includes("RAILWAY_GIT_COMMIT_SHA"), "health route leaks commit source");
  assert(!healthRoute.includes("commit"), "health route should not include commit field");

  // Operational routes should use shared hardening header policy.
  assert(
    healthRoute.includes('OPERATIONAL_RESPONSE_HEADERS'),
    "health route missing shared operational headers usage",
  );
  assert(
    connectorsStatusRoute.includes('OPERATIONAL_RESPONSE_HEADERS'),
    "connectors status route missing shared operational headers usage",
  );

  // Shared policy must include required hardening headers.
  assert(
    operationalHeaders.includes('"X-Robots-Tag": "noindex, nofollow"'),
    "operational headers missing X-Robots-Tag",
  );
  assert(
    operationalHeaders.includes('"X-Content-Type-Options": "nosniff"'),
    "operational headers missing nosniff",
  );
  assert(
    operationalHeaders.includes('"Referrer-Policy": "no-referrer"'),
    "operational headers missing referrer policy",
  );
  assert(
    operationalHeaders.includes('"X-Frame-Options": "DENY"'),
    "operational headers missing frame policy",
  );
  assert(
    operationalHeaders.includes('"Permissions-Policy": "geolocation=(), camera=(), microphone=()"'),
    "operational headers missing permissions policy",
  );
  assert(
    operationalHeaders.includes('"Cross-Origin-Resource-Policy": "same-origin"'),
    "operational headers missing CORP header",
  );

  // Connectors status should enforce auth when Supabase auth is enabled.
  assert(connectorsStatusRoute.includes("hasSupabaseAuth()"), "connectors status route missing auth mode check");
  assert(connectorsStatusRoute.includes('error: "unauthorized"'), "connectors status route missing unauthorized response");
  // Connectors UI should not directly expose full backend URLs.
  assert(connectorsPage.includes("connectorOriginLabel("), "connectors page missing origin redaction helper");
  assert(!connectorsPage.includes("title={c.baseUrl}"), "connectors page tooltip leaks full backend URL");
  assert(!connectorsPage.includes("{c.baseUrl}"), "connectors page renders raw backend URL");
  assert(!connectorsPage.includes("href={c.baseUrl}"), "connectors page links directly to raw backend URL");

  // Public docs should reflect auth hardening for connector status endpoint.
  assert(
    apiCatalog.includes("Session cookie when Supabase auth is enabled"),
    "API catalog missing updated auth note for /api/connectors/status",
  );

  // Status page must use sanitized view, not raw health dump.
  assert(statusPage.includes("const statusView ="), "status page missing statusView sanitizer");
  assert(statusPage.includes("JSON.stringify(statusView"), "status page should render statusView");
  assert(!statusPage.includes("JSON.stringify(health"), "status page still renders raw health JSON");

  // Crawler controls for operational endpoints/pages.
  assert(robots.includes('"/status"'), "robots missing /status disallow");
  assert(robots.includes('"/api/health"'), "robots missing /api/health disallow");
  assert(robots.includes('"/api/connectors/status"'), "robots missing /api/connectors/status disallow");
  assert(!sitemap.includes('path: "/status"'), "sitemap should not include /status");

  // Canonical host consistency: enforce apex canonical and www->apex redirect in edge routing.
  assert(
    siteBrandLib.includes('SITE_PRIMARY_DOMAIN = "smohix.run"'),
    "site primary domain should be apex smohix.run",
  );
  assert(
    siteLib.includes("SITE_DOMAIN = SITE_PRIMARY_DOMAIN"),
    "site domain should derive from primary domain constant",
  );
  assert(
    rootLayout.includes("alternates:") &&
      (rootLayout.includes("canonical: siteUrl") ||
        rootLayout.includes("canonical: homepageCanonical") ||
        rootLayout.includes("getCanonicalUrl(\"/\")")),
    "root metadata missing canonical alternates wiring",
  );
  assert(
    siteLib.includes("zentro.run") && siteLib.includes("PRODUCTION_SITE_URL"),
    "getSiteUrl must remap legacy zentro.run SEO hosts to smohix.run",
  );
  assert(
    rootProxyOrMiddleware.includes("host.startsWith(\"www.\")"),
    "proxy/middleware missing www host detection",
  );
  assert(
    rootProxyOrMiddleware.includes("url.hostname = host.replace(/^www\\./, \"\")"),
    "proxy/middleware missing www-to-apex hostname rewrite",
  );
  assert(
    rootProxyOrMiddleware.includes("NextResponse.redirect(url"),
    "proxy/middleware missing canonical redirect response",
  );

  const billingLib = await read("lib/billing.ts");
  assert(
    billingLib.includes('SITE_EMAIL_CONTACT = "hi@smohix.run"'),
    "billing should define single hi@ contact inbox",
  );
  assert(
    !billingLib.includes("support@smohix.run"),
    "legacy support@ inbox should be removed from billing",
  );

  // Guard key public/operational files against accidental deployment fingerprint leakage.
  for (const file of guardedPublicFiles) {
    const content = await read(file);
    for (const token of forbiddenPublicTokens) {
      assert(
        !content.includes(token),
        `forbidden token "${token}" found in ${file}`,
      );
    }
  }

  console.log("security-regression: all checks passed");
}

main().catch((error) => {
  console.error(`security-regression: FAILED\n${error.message}`);
  process.exitCode = 1;
});

