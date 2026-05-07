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
  const servicesPage = await read("app/(app)/services/page.tsx");
  const overviewPage = await read("app/(app)/overview/page.tsx");
  const sloLib = await read("lib/services/slo.ts");

  // Services page: burn filters + sorting + action rails should stay present.
  assert(
    servicesPage.includes("searchParams: Promise<{ error?: string; burn?: string }>;"),
    "services page missing burn searchParam typing",
  );
  assert(
    servicesPage.includes('(["all", "critical", "warning", "healthy"] as const)'),
    "services page missing burn filter chip set",
  );
  assert(
    servicesPage.includes("const visibleRows = rows"),
    "services page missing visibleRows derivation",
  );
  assert(
    servicesPage.includes("const burnRank = new Map"),
    "services page missing burn severity ranking",
  );
  assert(
    servicesPage.includes("Critical-burn triage mode: prioritize containment and guardrailed response."),
    "services page missing critical triage rail copy",
  );
  assert(
    servicesPage.includes("Warning-burn watch mode: prep mitigations before services enter critical burn."),
    "services page missing warning watch rail copy",
  );
  assert(
    servicesPage.includes("{state} burn (7d)"),
    "services page missing per-service burn badge",
  );

  // Overview page: triage widget and top critical list should remain.
  assert(
    overviewPage.includes("Burn triage shortcuts"),
    "overview page missing burn triage widget heading",
  );
  assert(
    overviewPage.includes('href="/services?burn=critical"'),
    "overview page missing critical services shortcut",
  );
  assert(
    overviewPage.includes("Top critical services"),
    "overview page missing top critical services section",
  );
  assert(
    overviewPage.includes("topCriticalServices = serviceRows"),
    "overview page missing top critical services computation",
  );
  assert(
    overviewPage.includes(
      'href={`/incidents/new?service_id=${encodeURIComponent(service.id)}&severity=critical&title=${encodeURIComponent(`Critical burn budget risk: ${service.name}`)}`}',
    ),
    "overview page critical service chips should link with incident context prefill",
  );
  const newIncidentPage = await read("app/(app)/incidents/new/page.tsx");
  assert(
    newIncidentPage.includes("preselectedServiceId"),
    "new incident page missing preselected service support",
  );
  assert(
    newIncidentPage.includes("defaultValue={preselectedServiceId}"),
    "new incident page service selector should use preselected service",
  );
  assert(
    newIncidentPage.includes("const preselectedSeverity"),
    "new incident page missing severity prefill support",
  );
  assert(
    newIncidentPage.includes("defaultValue={prefilledTitle}"),
    "new incident page title should support prefill",
  );

  // SLO lib should expose bulk burn-state listing used by services/overview.
  assert(
    sloLib.includes("export async function listLatestBurnStatesForUser"),
    "slo library missing listLatestBurnStatesForUser",
  );

  console.log("test-slo-triage-ui: all checks passed");
}

main().catch((error) => {
  console.error(`test-slo-triage-ui: FAILED\n${error.message}`);
  process.exitCode = 1;
});
