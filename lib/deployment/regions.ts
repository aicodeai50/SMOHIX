import type { DeploymentRegion } from "@/lib/deployment/types";

export const DEPLOYMENT_REGIONS: DeploymentRegion[] = [
  { id: "us-east-1", label: "US East (N. Virginia)", provider: "aws", fedrampEligible: true, govCloud: false },
  { id: "us-west-2", label: "US West (Oregon)", provider: "aws", fedrampEligible: true, govCloud: false },
  { id: "us-gov-east-1", label: "AWS GovCloud US-East", provider: "aws", fedrampEligible: true, govCloud: true },
  { id: "us-gov-west-1", label: "AWS GovCloud US-West", provider: "aws", fedrampEligible: true, govCloud: true },
  { id: "eu-west-1", label: "EU West (Ireland)", provider: "aws", fedrampEligible: false, govCloud: false },
  { id: "eu-central-1", label: "EU Central (Frankfurt)", provider: "aws", fedrampEligible: false, govCloud: false },
];

const BY_ID = new Map(DEPLOYMENT_REGIONS.map((r) => [r.id, r]));

export function getDeploymentRegion(id: string): DeploymentRegion | undefined {
  return BY_ID.get(id);
}

export function listRegionsForBoundary(boundary: "shared" | "dedicated_project" | "gov_cloud"): DeploymentRegion[] {
  if (boundary === "gov_cloud") {
    return DEPLOYMENT_REGIONS.filter((r) => r.govCloud);
  }
  return DEPLOYMENT_REGIONS.filter((r) => !r.govCloud);
}

export const DATA_BOUNDARY_LABELS: Record<string, string> = {
  shared: "Shared multi-tenant Supabase project",
  dedicated_project: "Dedicated Supabase project (customer region)",
  gov_cloud: "GovCloud / IL5-aligned isolated project",
};

export const DEPLOYMENT_TIER_LABELS: Record<string, string> = {
  standard: "Standard SaaS",
  regulated: "Regulated (dedicated region)",
  fedramp_ready: "FedRAMP-ready posture",
};
