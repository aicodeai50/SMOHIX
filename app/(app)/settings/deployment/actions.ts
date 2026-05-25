"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { updateDeploymentProfileForOrg } from "@/lib/deployment/profile";
import type { DataBoundary, DeploymentTier } from "@/lib/deployment/types";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { updateRetentionPolicyForOrg } from "@/lib/retention/org-policy";
import { parseRetentionDaysField } from "@/lib/retention/policy";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateDeploymentProfileAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/settings");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/settings/deployment");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/settings/deployment?error=rbac");
  }

  const deploymentTier = String(formData.get("deployment_tier") ?? "standard").trim() as DeploymentTier;
  const dataRegion = String(formData.get("data_region") ?? "us-east-1").trim();
  const dataBoundary = String(formData.get("data_boundary") ?? "shared").trim() as DataBoundary;
  const boundaryNotes = String(formData.get("boundary_notes") ?? "").trim();

  const result = await updateDeploymentProfileForOrg(orgContext.orgId, {
    deploymentTier,
    dataRegion,
    dataBoundary,
    boundaryNotes: boundaryNotes || null,
  });

  if (!result.ok) {
    redirect(`/settings/deployment?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.deployment_profile_updated",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      org_id: orgContext.orgId,
      deployment_tier: deploymentTier,
      data_region: dataRegion,
      data_boundary: dataBoundary,
    },
  });

  revalidatePath("/settings/deployment");
  revalidatePath("/settings");
  revalidatePath("/enterprise");
  redirect("/settings/deployment?saved=1");
}

export async function updateRetentionPolicyAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/settings");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/settings/deployment");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/settings/deployment?error=rbac");
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("deployment_tier")
    .eq("id", orgContext.orgId)
    .maybeSingle();
  const deploymentTier = String(orgRow?.deployment_tier ?? "standard").trim() as DeploymentTier;
  const tier: DeploymentTier =
    deploymentTier === "regulated" || deploymentTier === "fedramp_ready"
      ? deploymentTier
      : "standard";

  const auditRaw = String(formData.get("audit_retention_days") ?? "");
  const incidentRaw = String(formData.get("incident_retention_days") ?? "");

  const result = await updateRetentionPolicyForOrg(orgContext.orgId, tier, {
    auditRetentionDays: parseRetentionDaysField(auditRaw),
    incidentRetentionDays: parseRetentionDaysField(incidentRaw),
  });

  if (!result.ok) {
    redirect(`/settings/deployment?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.retention_policy_updated",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      org_id: orgContext.orgId,
      audit_retention_days: result.policy.auditRetentionDays,
      incident_retention_days: result.policy.incidentRetentionDays,
      audit_override_days: result.policy.auditOverrideDays,
      incident_override_days: result.policy.incidentOverrideDays,
    },
  });

  revalidatePath("/settings/deployment");
  revalidatePath("/settings");
  redirect("/settings/deployment?retention_saved=1");
}
