"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { auditWindowToSinceIso } from "@/lib/audit/export-window";
import { createEvidenceBundle } from "@/lib/compliance/evidence-bundle";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function siteOriginFromEnv(): string {
  return ((process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL) ?? "https://smohix.run").replace(/\/$/, "");
}

export async function createEvidenceBundleAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/bundles");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/bundles");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/bundles?error=rbac");
  }

  const windowParam = String(formData.get("window") ?? "30d");
  auditWindowToSinceIso(windowParam);

  const result = await createEvidenceBundle(user.id, orgContext.orgId, {
    windowParam,
    siteOrigin: siteOriginFromEnv(),
    supabase,
  });

  if (!result.ok) {
    redirect(`/governance/compliance/bundles?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.evidence_bundle_created",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      bundle_id: result.bundle.id,
      manifest_sha256: result.bundle.manifestSha256,
      window: result.bundle.windowLabel,
    },
  });

  revalidatePath("/governance/compliance/bundles");
  revalidatePath("/governance/compliance");
  redirect(`/governance/compliance/bundles?created=${encodeURIComponent(result.bundle.id)}`);
}

export async function updateEvidenceWebhookAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/bundles");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/bundles");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/bundles?error=rbac");
  }

  const raw = String(formData.get("evidence_bundle_webhook_url") ?? "").trim();
  const url = raw.length === 0 ? null : raw;
  if (url && !url.startsWith("https://")) {
    redirect("/governance/compliance/bundles?error=webhook_https");
  }

  const { error } = await supabase
    .from("organizations")
    .update({ evidence_bundle_webhook_url: url })
    .eq("id", orgContext.orgId);

  if (error) {
    redirect(`/governance/compliance/bundles?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/governance/compliance/bundles");
  redirect("/governance/compliance/bundles?webhook_saved=1");
}
