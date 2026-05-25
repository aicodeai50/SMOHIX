"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  createComplianceAssessorApiToken,
  revokeComplianceAssessorApiToken,
} from "@/lib/compliance/assessor-api-token";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createAssessorApiTokenAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/assessor-api");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/assessor-api");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/assessor-api?error=rbac");
  }

  const name = String(formData.get("name") ?? "Assessor API token").trim();
  const result = await createComplianceAssessorApiToken(user.id, orgContext.orgId, name, supabase);
  if ("error" in result) {
    redirect(`/governance/compliance/assessor-api?error=${encodeURIComponent(result.error)}`);
  }

  await appendAuditEvent({
    event_type: "governance.assessor_api_token_created",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { token_id: result.row.id, name: result.row.name },
  });

  revalidatePath("/governance/compliance/assessor-api");
  redirect(
    `/governance/compliance/assessor-api?created=1&key=${encodeURIComponent(result.plainKey)}&id=${encodeURIComponent(result.row.id)}`,
  );
}

export async function revokeAssessorApiTokenAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/assessor-api");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/assessor-api");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/assessor-api?error=rbac");
  }

  const tokenId = String(formData.get("token_id") ?? "").trim();
  if (!tokenId) redirect("/governance/compliance/assessor-api?error=missing_id");

  const ok = await revokeComplianceAssessorApiToken(orgContext.orgId, tokenId, supabase);
  if (!ok) redirect("/governance/compliance/assessor-api?error=revoke_failed");

  await appendAuditEvent({
    event_type: "governance.assessor_api_token_revoked",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { token_id: tokenId },
  });

  revalidatePath("/governance/compliance/assessor-api");
  redirect("/governance/compliance/assessor-api?revoked=1");
}
