"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { runComplianceDigestForOrg } from "@/lib/compliance/compliance-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function siteOriginFromEnv(): string {
  return ((process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL) ?? "https://smohix.run").replace(/\/$/, "");
}

export async function runComplianceDigestAction() {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/digest");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/digest");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/digest?error=rbac");
  }

  const result = await runComplianceDigestForOrg(user.id, orgContext.orgId, {
    periodDays: 30,
    siteOrigin: siteOriginFromEnv(),
    supabase,
  });

  if (!result.ok) {
    redirect(`/governance/compliance/digest?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.compliance_digest_delivered",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      delivery_id: result.delivery.id,
      webhook_delivered: result.webhookDelivered,
      overall_readiness_percent: result.digest.summary.overallReadinessPercent,
    },
  });

  revalidatePath("/governance/compliance/digest");
  revalidatePath("/governance/compliance/program");
  redirect(`/governance/compliance/digest?sent=${encodeURIComponent(result.delivery.id)}`);
}

export async function updateComplianceDigestWebhookAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/digest");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/digest");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/digest?error=rbac");
  }

  const raw = String(formData.get("compliance_digest_webhook_url") ?? "").trim();
  const url = raw.length === 0 ? null : raw;
  if (url && !url.startsWith("https://")) {
    redirect("/governance/compliance/digest?error=webhook_https");
  }

  const { error } = await supabase
    .from("organizations")
    .update({ compliance_digest_webhook_url: url })
    .eq("id", orgContext.orgId);

  if (error) {
    redirect(`/governance/compliance/digest?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/governance/compliance/digest");
  redirect("/governance/compliance/digest?webhook_saved=1");
}
