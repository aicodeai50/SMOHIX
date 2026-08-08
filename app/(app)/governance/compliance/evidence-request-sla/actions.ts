"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deliverEvidenceRequestSlaDigest } from "@/lib/compliance/evidence-request-sla-dashboard";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function siteOriginFromEnv(): string {
  return ((process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL) ?? "https://smohix.run").replace(/\/$/, "");
}

export async function deliverEvidenceRequestSlaDigestAction() {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/evidence-request-sla");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/evidence-request-sla");

  const orgContext = await getOrgContextForUser(user.id);
  const role = orgContext.role;
  const allowed =
    role && (canManageMembers(role) || isReadOnlyAuditorRole(role));
  if (!orgContext.orgId || !allowed) {
    redirect("/governance/compliance/evidence-request-sla?error=rbac");
  }

  const result = await deliverEvidenceRequestSlaDigest(user.id, orgContext.orgId, {
    siteOrigin: siteOriginFromEnv(),
    orgName: orgContext.orgName ?? undefined,
    supabase,
  });

  if (!result.ok) {
    redirect(`/governance/compliance/evidence-request-sla?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/governance/compliance/evidence-request-sla");
  redirect(
    `/governance/compliance/evidence-request-sla?delivered=1&emails=${result.emailsSent}&webhook=${result.webhookDelivered ? "1" : "0"}`,
  );
}
