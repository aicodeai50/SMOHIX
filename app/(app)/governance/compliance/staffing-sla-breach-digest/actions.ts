"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deliverStaffingSlaBreachDigest,
  updateStaffingSlaBreachDigestOrgSettings,
} from "@/lib/compliance/staffing-action-sla-breach-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/staffing-sla-breach-digest";

function siteOriginFromEnv(): string {
  return (process.env.ZENTRO_SITE_URL ?? "https://zentro.run").replace(/\/$/, "");
}

export async function deliverStaffingSlaBreachDigestAction(formData: FormData) {
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

  const result = await deliverStaffingSlaBreachDigest(user.id, orgContext.orgId, {
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
    `${PATH}?delivered=1&breaches=${result.pack.breachItems.length}&emails=${result.emailsSent}&slack=${result.slackSent ? "1" : "0"}`,
  );
}

export async function updateStaffingSlaBreachDigestSettingsAction(formData: FormData) {
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

  const slaRaw = Number.parseInt(String(formData.get("sla_days") ?? "7"), 10);

  const ok = await updateStaffingSlaBreachDigestOrgSettings(
    orgContext.orgId,
    {
      digestEnabled: formData.get("digest_enabled") === "on",
      emailEnabled: formData.get("email_enabled") === "on",
      slaDaysAfterPeakWeek: Number.isFinite(slaRaw) ? slaRaw : 7,
    },
    supabase,
  );

  if (!ok) redirect(`${PATH}?error=settings_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
