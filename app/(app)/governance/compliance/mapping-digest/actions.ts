"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { runRegulatoryMappingDigestForOrg } from "@/lib/compliance/regulatory-mapping-change-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/mapping-digest";

function siteOriginFromEnv(): string {
  return ((process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL) ?? "https://smohix.run").replace(/\/$/, "");
}

export async function runMappingDigestAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect(`${PATH}?error=rbac`);
  }

  const forceNotify = String(formData.get("forceNotify") ?? "") === "1";

  const result = await runRegulatoryMappingDigestForOrg(user.id, orgContext.orgId, {
    siteOrigin: siteOriginFromEnv(),
    supabase,
    forceNotify,
  });

  if (!result.ok) {
    redirect(`${PATH}?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.regulatory_mapping_digest_delivered",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      delivery_id: result.delivery.id,
      change_count: result.digest.deltas.changeCount,
      webhook_delivered: result.webhookDelivered,
      emails_sent: result.emailsSent,
    },
  });

  revalidatePath(PATH);
  redirect(`${PATH}?sent=${encodeURIComponent(result.delivery.id)}`);
}

export async function updateMappingDigestSettingsAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect(`${PATH}?error=rbac`);
  }

  const rawUrl = String(formData.get("compliance_mapping_digest_webhook_url") ?? "").trim();
  const url = rawUrl.length === 0 ? null : rawUrl;
  if (url && !url.startsWith("https://")) {
    redirect(`${PATH}?error=webhook_https`);
  }

  const emailEnabled = String(formData.get("compliance_mapping_digest_email_enabled") ?? "") === "on";

  const { error } = await supabase
    .from("organizations")
    .update({
      compliance_mapping_digest_webhook_url: url,
      compliance_mapping_digest_email_enabled: emailEnabled,
    })
    .eq("id", orgContext.orgId);

  if (error) {
    redirect(`${PATH}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
