"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { runAttestationRenewalNudgesForOrg } from "@/lib/compliance/attestation-renewal-calendar";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function siteOriginFromEnv(): string {
  return (process.env.ZENTRO_SITE_URL ?? "https://zentro.run").replace(/\/$/, "");
}

export async function runAttestationRenewalNudgesAction() {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/attestation-renewal");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/attestation-renewal");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/attestation-renewal?error=rbac");
  }

  const result = await runAttestationRenewalNudgesForOrg(user.id, orgContext.orgId, {
    siteOrigin: siteOriginFromEnv(),
    orgName: orgContext.orgName ?? undefined,
    supabase,
  });

  if (!result.ok) {
    redirect(`/governance/compliance/attestation-renewal?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.attestation_renewal_nudges_sent",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      emails_sent: result.emailsSent,
      controls_notified: result.controlsNotified,
    },
  });

  revalidatePath("/governance/compliance/attestation-renewal");
  redirect(
    `/governance/compliance/attestation-renewal?sent=1&emails=${result.emailsSent}&skipped=${result.emailsSkipped}`,
  );
}
