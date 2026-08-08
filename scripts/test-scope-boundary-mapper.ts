import type { ServiceRow } from "../lib/services/data";
import type { ServiceDependencyEdge } from "../lib/services/dependencies";
import {
  buildOrgBoundaryNarrative,
  buildScopeBoundaryMapperPackFromParts,
  buildScopeDataFlows,
  buildScopeSystemsFromServices,
  dedupeValidControlIds,
  summarizeFrameworkCoverage,
} from "../lib/compliance/scope-boundary-mapper";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const services: ServiceRow[] = [
  {
    id: "svc-prod",
    name: "api.smohix.run",
    description: "Production API",
    environment: "production",
    ownerHint: "platform",
    updated: "1d ago",
  },
  {
    id: "svc-dev",
    name: "dev-api",
    description: "Dev sandbox",
    environment: "development",
    ownerHint: null,
    updated: "2d ago",
  },
];

const serviceSystems = buildScopeSystemsFromServices(
  services,
  new Map([["svc-prod", 2]]),
  new Set(["svc-prod"]),
);

const prod = serviceSystems.find((s) => s.name === "api.smohix.run");
const dev = serviceSystems.find((s) => s.name === "dev-api");
assert(prod?.inScope === true, "production in scope");
assert(dev?.inScope === false, "development out of scope");
assert((prod?.controlIds.length ?? 0) > 0, "prod has controls");

const edges: ServiceDependencyEdge[] = [
  {
    fromServiceId: "svc-prod",
    fromServiceName: "api.smohix.run",
    toServiceId: "svc-db",
    toServiceName: "postgres",
    relationship: "data",
    criticality: "high",
  },
];

const byServiceId = new Map(serviceSystems.filter((s) => s.linkedServiceId).map((s) => [s.linkedServiceId!, s]));
const flows = buildScopeDataFlows(edges, byServiceId);
assert(flows[0].controlIds.length > 0, "data flow has controls");

const ids = dedupeValidControlIds(["soc2:CC6.1", "soc2:CC6.1", "invalid:id"]);
assert(ids.length === 1, "dedupe controls");

const coverage = summarizeFrameworkCoverage(serviceSystems.filter((s) => s.inScope));
assert(coverage.some((c) => c.framework === "soc2"), "soc2 coverage row");

const pack = buildScopeBoundaryMapperPackFromParts({
  orgId: "org-1",
  orgBoundary: {
    deploymentTier: "saas",
    dataRegion: "us-east",
    dataBoundary: "Production workloads only",
    narrative: buildOrgBoundaryNarrative({
      deploymentTier: "saas",
      dataRegion: "us-east",
      dataBoundary: "Production workloads only",
      narrative: "",
    }),
  },
  systems: serviceSystems,
  dataFlows: flows,
});
assert(pack.inScopeSystemCount >= 1, "pack in scope count");

assert(
  isPathAllowedForAuditor("/governance/compliance/scope-boundary"),
  "auditor can open scope boundary",
);

console.log("test-scope-boundary-mapper: all checks passed");
