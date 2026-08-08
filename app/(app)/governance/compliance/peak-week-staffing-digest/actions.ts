"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deliverPeakWeekStaffingDigest,
  updatePeakWeekStaffingDigestOrgSettings,
} from "@/lib/compliance/committee-peak-week-staffing-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/peak-week-staffing-digest";

function siteOriginFromEnv(): string {
  return ((process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL) ?? "https://smohix.run").replace(/\/$/, "");
}

export async function deliverPeakWeekStaffingDigestAction(formData: FormData) {
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

  const result = await deliverPeakWeekStaffingDigest(user.id, orgContext.orgId, {
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
    `${PATH}?delivered=1&emails=${result.emailsSent}&slack=${result.slackSent ? "1" : "0"}&webhook=${result.webhookDelivered ? "1" : "0"}`,
  );
}

export async function updatePeakWeekStaffingDigestSettingsAction(formData: FormData) {
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

  const webhookRaw = String(formData.get("webhook_url") ?? "").trim();

  const ok = await updatePeakWeekStaffingDigestOrgSettings(
    orgContext.orgId,
    {
      digestEnabled: formData.get("digest_enabled") === "on",
      emailEnabled: formData.get("email_enabled") === "on",
      webhookUrl: webhookRaw.length > 0 ? webhookRaw : null,
    },
    supabase,
  );

  if (!ok) redirect(`${PATH}?error=settings_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
