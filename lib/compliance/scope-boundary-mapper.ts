import type { SupabaseClient } from "@supabase/supabase-js";

import { getComplianceControl } from "@/lib/compliance/catalog";
import { BASELINE_COMPARISON_FRAMEWORKS } from "@/lib/compliance/baseline-comparison";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { listServiceDependencyGraphForUser, type ServiceDependencyEdge } from "@/lib/services/dependencies";
import type { ServiceRow } from "@/lib/services/data";
import { listServicesForUser } from "@/lib/services/data";
import { inheritControlIdsForVendor } from "@/lib/third-party-risk/inheritance";
import { listThirdPartyVendors } from "@/lib/third-party-risk/data";
import type { ThirdPartyVendorRow } from "@/lib/third-party-risk/types";
import { listVulnerabilityFindingsForUser } from "@/lib/vulnerabilities/data";
import { matchAssetHostToService } from "@/lib/vulnerabilities/priority";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const SCOPE_BOUNDARY_MAPPER_VERSION = "zentro-scope-boundary-mapper/1";

export type ScopeBoundaryZone =
  | "cardholder"
  | "production"
  | "staging"
  | "development"
  | "external"
  | "unmapped_asset";

export type ScopeSystemKind = "service" | "asset_host" | "vendor";

export type ScopeBoundarySystem = {
  id: string;
  kind: ScopeSystemKind;
  name: string;
  inScope: boolean;
  zone: ScopeBoundaryZone;
  environment: string | null;
  detail: string;
  linkedServiceId: string | null;
  openFindingCount: number;
  controlIds: string[];
  frameworks: ComplianceFramework[];
  href: string;
};

export type ScopeDataFlow = {
  id: string;
  fromSystemId: string;
  fromName: string;
  toSystemId: string;
  toName: string;
  relationship: ServiceDependencyEdge["relationship"];
  criticality: ServiceDependencyEdge["criticality"];
  inScope: boolean;
  controlIds: string[];
  label: string;
};

export type ScopeFrameworkCoverage = {
  framework: ComplianceFramework;
  label: string;
  inScopeSystemCount: number;
  mappedControlCount: number;
  consolePath: string;
};

export type OrgBoundaryContext = {
  deploymentTier: string | null;
  dataRegion: string | null;
  dataBoundary: string | null;
  narrative: string;
};

export type ScopeBoundaryMapperPack = {
  version: typeof SCOPE_BOUNDARY_MAPPER_VERSION;
  generatedAt: string;
  orgId: string | null;
  orgBoundary: OrgBoundaryContext;
  inScopeSystemCount: number;
  outOfScopeSystemCount: number;
  dataFlowCount: number;
  vendorCount: number;
  systems: ScopeBoundarySystem[];
  dataFlows: ScopeDataFlow[];
  frameworkCoverage: ScopeFrameworkCoverage[];
  unmappedAssetCount: number;
};

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF",
  cis_v8: "CIS v8",
  cmmc_l2: "CMMC L2",
  gdpr_art32: "GDPR Art. 32",
};

const FRAMEWORK_CONSOLE_PATHS: Record<ComplianceFramework, string> = {
  soc2: "/governance/compliance/type-ii",
  iso27001: "/governance/compliance/iso-assessment",
  pcidss: "/governance/compliance/pci-dss",
  hipaa: "/governance/compliance/hipaa",
  nist_csf: "/governance/compliance/nist-csf",
  cis_v8: "/governance/compliance/cis-v8",
  cmmc_l2: "/governance/compliance/cmmc-l2",
  gdpr_art32: "/governance/compliance/gdpr-art32",
};

const ENV_ZONE: Record<string, ScopeBoundaryZone> = {
  production: "production",
  prod: "production",
  staging: "staging",
  stage: "staging",
  uat: "staging",
  development: "development",
  dev: "development",
  test: "development",
  sandbox: "development",
};

const SERVICE_ZONE_CONTROLS: Record<ScopeBoundaryZone, string[]> = {
  cardholder: ["pcidss:3.2.1", "pcidss:4.2.1", "pcidss:10.2.1", "soc2:CC6.1", "soc2:CC7.2"],
  production: ["soc2:CC6.1", "soc2:CC7.2", "soc2:CC8.1", "nist_csf:ID.AM-01", "cis_v8:1.1"],
  staging: ["soc2:CC8.1", "iso:A.8.25", "nist_csf:ID.RA-01"],
  development: ["soc2:CC5.3", "iso:A.8.9"],
  external: ["soc2:CC1.2", "iso:A.5.23", "pcidss:12.3.1"],
  unmapped_asset: ["nist_csf:ID.AM-01", "cis_v8:1.1", "soc2:CC7.2"],
};

const FLOW_RELATIONSHIP_CONTROLS: Record<ServiceDependencyEdge["relationship"], string[]> = {
  data: ["hipaa:164.312e1", "gdpr_art32:32-a2", "gdpr_art32:32-b1", "pcidss:4.2.1"],
  auth: ["soc2:CC6.1", "iso:A.5.15", "hipaa:164.312a1"],
  network: ["pcidss:11.5.1", "cmmc_l2:3.13.1", "soc2:CC6.6"],
  runtime: ["soc2:CC7.2", "iso:A.8.16", "nist_csf:DE.CM-01"],
  other: ["soc2:CC5.3", "iso:A.5.23"],
};

function normalizeEnv(env: string | null): string {
  return (env ?? "").trim().toLowerCase();
}

function zoneForService(env: string | null, name: string): ScopeBoundaryZone {
  const key = normalizeEnv(env);
  if (ENV_ZONE[key]) return ENV_ZONE[key];
  if (/card|cde|pci/i.test(name)) return "cardholder";
  if (key) return "production";
  return "production";
}

function serviceInScope(zone: ScopeBoundaryZone, hasOpenFindings: boolean, hasDeps: boolean): boolean {
  if (zone === "development") return false;
  if (zone === "staging") return hasOpenFindings || hasDeps;
  return true;
}

export function dedupeValidControlIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!getComplianceControl(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.sort();
}

export function frameworksForControlIds(controlIds: string[]): ComplianceFramework[] {
  const fw = new Set<ComplianceFramework>();
  for (const id of controlIds) {
    const c = getComplianceControl(id);
    if (c) fw.add(c.framework);
  }
  return [...fw].sort();
}

export function buildOrgBoundaryNarrative(input: OrgBoundaryContext): string {
  const parts: string[] = [];
  if (input.dataBoundary) parts.push(`Declared boundary: ${input.dataBoundary}`);
  if (input.deploymentTier) parts.push(`Deployment tier: ${input.deploymentTier}`);
  if (input.dataRegion) parts.push(`Data region: ${input.dataRegion}`);
  if (parts.length === 0) {
    return "Boundary derived from live services, dependency graph, vulnerability assets, and third-party vendors.";
  }
  return parts.join(" · ");
}

export function buildScopeSystemsFromServices(
  services: ServiceRow[],
  openFindingsByServiceId: Map<string, number>,
  serviceIdsInGraph: Set<string>,
): ScopeBoundarySystem[] {
  return services.map((svc) => {
    const zone = zoneForService(svc.environment, svc.name);
    const openCount = openFindingsByServiceId.get(svc.id) ?? 0;
    const hasDeps = serviceIdsInGraph.has(svc.id);
    const inScope = serviceInScope(zone, openCount > 0, hasDeps);
    const controlIds = dedupeValidControlIds(SERVICE_ZONE_CONTROLS[zone] ?? SERVICE_ZONE_CONTROLS.production);

    return {
      id: `service-${svc.id}`,
      kind: "service" as const,
      name: svc.name,
      inScope,
      zone,
      environment: svc.environment,
      detail: svc.description ?? svc.ownerHint ?? "Registered service",
      linkedServiceId: svc.id,
      openFindingCount: openCount,
      controlIds,
      frameworks: frameworksForControlIds(controlIds),
      href: "/services",
    };
  });
}

export function buildUnmappedAssetSystems(
  assetHosts: string[],
  services: ServiceRow[],
): ScopeBoundarySystem[] {
  const seen = new Set<string>();
  const systems: ScopeBoundarySystem[] = [];

  for (const host of assetHosts) {
    const h = host.trim().toLowerCase();
    if (!h || seen.has(h)) continue;
    if (matchAssetHostToService(host, services)) continue;
    seen.add(h);

    const controlIds = dedupeValidControlIds(SERVICE_ZONE_CONTROLS.unmapped_asset);
    systems.push({
      id: `asset-${h.replace(/[^a-z0-9.-]/g, "-")}`,
      kind: "asset_host",
      name: host,
      inScope: true,
      zone: "unmapped_asset",
      environment: null,
      detail: "Vulnerability asset host not linked to a service — review boundary inclusion",
      linkedServiceId: null,
      openFindingCount: 0,
      controlIds,
      frameworks: frameworksForControlIds(controlIds),
      href: "/assets/vulnerabilities",
    });
  }

  return systems;
}

export function buildVendorBoundarySystems(vendors: ThirdPartyVendorRow[]): ScopeBoundarySystem[] {
  return vendors.map((v) => {
    const controlIds = dedupeValidControlIds(inheritControlIdsForVendor(v.riskTier, v.category));
    const inScope = v.riskTier === "high" || v.riskTier === "critical" || v.status === "active";

    return {
      id: `vendor-${v.id}`,
      kind: "vendor" as const,
      name: v.name,
      inScope,
      zone: "external" as const,
      environment: null,
      detail: `${v.riskTier} risk · ${v.category} · ${v.status}`,
      linkedServiceId: null,
      openFindingCount: 0,
      controlIds,
      frameworks: frameworksForControlIds(controlIds),
      href: "/governance/third-party-risk",
    };
  });
}

export function buildScopeDataFlows(
  edges: ServiceDependencyEdge[],
  systemsByServiceId: Map<string, ScopeBoundarySystem>,
): ScopeDataFlow[] {
  return edges.map((edge, idx) => {
    const from = systemsByServiceId.get(edge.fromServiceId);
    const to = systemsByServiceId.get(edge.toServiceId);
    const inScope = Boolean(from?.inScope && to?.inScope);
    const controlIds = dedupeValidControlIds([
      ...(FLOW_RELATIONSHIP_CONTROLS[edge.relationship] ?? []),
      ...(from?.controlIds ?? []).slice(0, 3),
      ...(to?.controlIds ?? []).slice(0, 3),
    ]);

    return {
      id: `flow-${idx}-${edge.fromServiceId}-${edge.toServiceId}`,
      fromSystemId: from?.id ?? `service-${edge.fromServiceId}`,
      fromName: edge.fromServiceName,
      toSystemId: to?.id ?? `service-${edge.toServiceId}`,
      toName: edge.toServiceName,
      relationship: edge.relationship,
      criticality: edge.criticality,
      inScope,
      controlIds,
      label: `${edge.relationship} (${edge.criticality})`,
    };
  });
}

export function summarizeFrameworkCoverage(
  systems: ScopeBoundarySystem[],
): ScopeFrameworkCoverage[] {
  const inScope = systems.filter((s) => s.inScope);

  return BASELINE_COMPARISON_FRAMEWORKS.map((framework) => {
    const controlIds = new Set<string>();
    let systemCount = 0;
    for (const sys of inScope) {
      if (!sys.frameworks.includes(framework)) continue;
      systemCount += 1;
      for (const id of sys.controlIds) {
        const c = getComplianceControl(id);
        if (c?.framework === framework) controlIds.add(id);
      }
    }
    return {
      framework,
      label: FRAMEWORK_LABELS[framework],
      inScopeSystemCount: systemCount,
      mappedControlCount: controlIds.size,
      consolePath: FRAMEWORK_CONSOLE_PATHS[framework],
    };
  }).filter((row) => row.mappedControlCount > 0 || row.inScopeSystemCount > 0);
}

export function buildScopeBoundaryMapperPackFromParts(input: {
  orgId: string | null;
  orgBoundary: OrgBoundaryContext;
  systems: ScopeBoundarySystem[];
  dataFlows: ScopeDataFlow[];
  generatedAt?: string;
}): ScopeBoundaryMapperPack {
  const inScope = input.systems.filter((s) => s.inScope);
  return {
    version: SCOPE_BOUNDARY_MAPPER_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    orgBoundary: input.orgBoundary,
    inScopeSystemCount: inScope.length,
    outOfScopeSystemCount: input.systems.length - inScope.length,
    dataFlowCount: input.dataFlows.filter((f) => f.inScope).length,
    vendorCount: input.systems.filter((s) => s.kind === "vendor").length,
    systems: input.systems,
    dataFlows: input.dataFlows,
    frameworkCoverage: summarizeFrameworkCoverage(input.systems),
    unmappedAssetCount: input.systems.filter((s) => s.kind === "asset_host").length,
  };
}

export async function buildScopeBoundaryMapperPack(
  userId: string,
  opts: {
    orgId: string | null;
    supabase?: SupabaseClient;
  },
): Promise<ScopeBoundaryMapperPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [services, graph, findings, vendors, orgRow] = await Promise.all([
    listServicesForUser(userId, opts.orgId),
    listServiceDependencyGraphForUser(supabase, userId, opts.orgId),
    listVulnerabilityFindingsForUser(userId, 200),
    listThirdPartyVendors(userId, opts.orgId, supabase),
    supabase
      .from("organizations")
      .select("deployment_tier, data_region, data_boundary")
      .eq("id", opts.orgId)
      .maybeSingle(),
  ]);

  const openFindingsByService = new Map<string, number>();
  const assetHosts: string[] = [];
  for (const f of findings) {
    if (f.status !== "open" && f.status !== "in_progress") continue;
    if (f.assetHost) assetHosts.push(f.assetHost);
    const matched = matchAssetHostToService(f.assetHost, services);
    if (matched) {
      openFindingsByService.set(matched.id, (openFindingsByService.get(matched.id) ?? 0) + 1);
    }
  }

  const serviceIdsInGraph = new Set<string>();
  for (const e of graph.edges) {
    serviceIdsInGraph.add(e.fromServiceId);
    serviceIdsInGraph.add(e.toServiceId);
  }

  const orgBoundary: OrgBoundaryContext = {
    deploymentTier: (orgRow.data?.deployment_tier as string | null) ?? null,
    dataRegion: (orgRow.data?.data_region as string | null) ?? null,
    dataBoundary: (orgRow.data?.data_boundary as string | null) ?? null,
    narrative: "",
  };
  orgBoundary.narrative = buildOrgBoundaryNarrative(orgBoundary);

  const serviceSystems = buildScopeSystemsFromServices(services, openFindingsByService, serviceIdsInGraph);
  const assetSystems = buildUnmappedAssetSystems(assetHosts, services);
  const vendorSystems = buildVendorBoundarySystems(vendors);
  const systems = [...serviceSystems, ...assetSystems, ...vendorSystems].sort((a, b) => {
    if (a.inScope !== b.inScope) return a.inScope ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const systemsByServiceId = new Map(
    serviceSystems.filter((s) => s.linkedServiceId).map((s) => [s.linkedServiceId!, s]),
  );
  const dataFlows = buildScopeDataFlows(graph.edges, systemsByServiceId);

  return buildScopeBoundaryMapperPackFromParts({
    orgId: opts.orgId,
    orgBoundary,
    systems,
    dataFlows,
  });
}

export function scopeBoundaryMapperToCsv(pack: ScopeBoundaryMapperPack): string {
  const header =
    "system_id,kind,name,in_scope,zone,control_ids,frameworks,open_findings,detail,href";
  const lines = pack.systems.map((s) =>
    [
      s.id,
      s.kind,
      JSON.stringify(s.name),
      s.inScope,
      s.zone,
      s.controlIds.join(";"),
      s.frameworks.join(";"),
      s.openFindingCount,
      JSON.stringify(s.detail),
      s.href,
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}
