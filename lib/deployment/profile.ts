import {
  DATA_BOUNDARY_LABELS,
  DEPLOYMENT_TIER_LABELS,
  getDeploymentRegion,
  listRegionsForBoundary,
} from "@/lib/deployment/regions";
import type {
  DataBoundary,
  DeploymentProfileUpdate,
  DeploymentTier,
  OrgDeploymentProfile,
} from "@/lib/deployment/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function complianceHints(
  tier: DeploymentTier,
  boundary: DataBoundary,
  regionId: string,
): string[] {
  const hints: string[] = [];
  const region = getDeploymentRegion(regionId);
  if (tier === "fedramp_ready") {
    hints.push("Use GovCloud boundary with a dedicated Supabase project in us-gov-*.");
    hints.push("Enable extended audit retention and export for assessor evidence packs.");
  }
  if (tier === "regulated") {
    hints.push("Pin Supabase and Railway deploy targets to the selected region.");
  }
  if (boundary === "dedicated_project") {
    hints.push("Org-scoped RLS data stays in your dedicated Postgres project.");
  }
  if (region?.govCloud) {
    hints.push("GovCloud regions require separate auth keys and connector endpoints.");
  }
  return hints;
}

export function validateDeploymentProfileUpdate(
  input: DeploymentProfileUpdate,
): { ok: true } | { ok: false; reason: string } {
  const region = getDeploymentRegion(input.dataRegion);
  if (!region) {
    return { ok: false, reason: "Select a supported data region." };
  }

  const allowedRegions = listRegionsForBoundary(input.dataBoundary);
  if (!allowedRegions.some((r) => r.id === input.dataRegion)) {
    return { ok: false, reason: "Region is not valid for the selected data boundary." };
  }

  if (input.deploymentTier === "fedramp_ready") {
    if (input.dataBoundary !== "gov_cloud") {
      return {
        ok: false,
        reason: "FedRAMP-ready tier requires GovCloud data boundary.",
      };
    }
    if (!region.govCloud) {
      return { ok: false, reason: "FedRAMP-ready tier requires a GovCloud region." };
    }
  }

  if (input.dataBoundary === "gov_cloud" && !region.govCloud) {
    return { ok: false, reason: "GovCloud boundary requires a GovCloud region." };
  }

  return { ok: true };
}

export async function getDeploymentProfileForOrg(
  orgId: string,
  orgName: string,
): Promise<OrgDeploymentProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, deployment_tier, data_region, data_boundary, boundary_notes")
      .eq("id", orgId)
      .maybeSingle();

    if (error || !data) return null;

    const deploymentTier = String(data.deployment_tier ?? "standard") as DeploymentTier;
    const dataRegion = String(data.data_region ?? "us-east-1");
    const dataBoundary = String(data.data_boundary ?? "shared") as DataBoundary;
    const region = getDeploymentRegion(dataRegion);

    return {
      orgId: String(data.id),
      orgName: String(data.name ?? orgName),
      deploymentTier,
      dataRegion,
      dataBoundary,
      boundaryNotes: (data.boundary_notes as string | null) ?? null,
      residencyLabel: region?.label ?? dataRegion,
      isolationLabel: DATA_BOUNDARY_LABELS[dataBoundary] ?? dataBoundary,
      complianceHints: complianceHints(deploymentTier, dataBoundary, dataRegion),
    };
  } catch {
    return null;
  }
}

export async function updateDeploymentProfileForOrg(
  orgId: string,
  input: DeploymentProfileUpdate,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const validated = validateDeploymentProfileUpdate(input);
  if (!validated.ok) return validated;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("organizations")
      .update({
        deployment_tier: input.deploymentTier,
        data_region: input.dataRegion,
        data_boundary: input.dataBoundary,
        boundary_notes: input.boundaryNotes?.trim().slice(0, 2000) || null,
      })
      .eq("id", orgId);

    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch {
    return { ok: false, reason: "Could not update deployment profile." };
  }
}

export function deploymentTierLabel(tier: DeploymentTier): string {
  return DEPLOYMENT_TIER_LABELS[tier] ?? tier;
}

export function dataBoundaryLabel(boundary: DataBoundary): string {
  return DATA_BOUNDARY_LABELS[boundary] ?? boundary;
}
