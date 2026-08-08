"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deliverQuarterlyObligationCommitteeDigest,
  updateCommitteeDigestOrgSettings,
} from "@/lib/compliance/quarterly-obligation-committee-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/committee-digest";

function siteOriginFromEnv(): string {
  return ((process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL) ?? "https://smohix.run").replace(/\/$/, "");
}

export async function deliverCommitteeDigestAction(formData: FormData) {
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

  const force = formData.get("force") === "1";

  const result = await deliverQuarterlyObligationCommitteeDigest(user.id, orgContext.orgId, {
    siteOrigin: siteOriginFromEnv(),
    orgName: orgContext.orgName ?? undefined,
    supabase,
    force,
  });

  if (!result.ok) {
    redirect(`${PATH}?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath(PATH);
  redirect(
    `${PATH}?delivered=1&emails=${result.emailsSent}&webhook=${result.webhookDelivered ? "1" : "0"}`,
  );
}

export async function updateCommitteeDigestSettingsAction(formData: FormData) {
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

  const emailEnabled = formData.get("digest_email_enabled") === "on";
  const webhookRaw = String(formData.get("digest_webhook_url") ?? "").trim();

  const ok = await updateCommitteeDigestOrgSettings(
    orgContext.orgId,
    {
      digestEmailEnabled: emailEnabled,
      digestWebhookUrl: webhookRaw.length > 0 ? webhookRaw : null,
    },
    supabase,
  );

  if (!ok) redirect(`${PATH}?error=settings_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
