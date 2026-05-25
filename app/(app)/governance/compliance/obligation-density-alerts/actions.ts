"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  runObligationDensityAlertsForOrg,
  updateObligationDensityAlertOrgSettings,
} from "@/lib/compliance/obligation-density-alerting";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/obligation-density-alerts";

function siteOriginFromEnv(): string {
  return (process.env.ZENTRO_SITE_URL ?? "https://zentro.run").replace(/\/$/, "");
}

export async function runObligationDensityAlertsAction(formData: FormData) {
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

  const result = await runObligationDensityAlertsForOrg(user.id, orgContext.orgId, {
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
    `${PATH}?sent=1&slack=${result.slackSent ? "1" : "0"}&emails=${result.emailsSent}&breaches=${result.breachesNotified}`,
  );
}

export async function updateObligationDensityAlertSettingsAction(formData: FormData) {
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

  const weekly = Number.parseInt(String(formData.get("weekly_threshold") ?? "8"), 10);
  const peak = Number.parseInt(String(formData.get("peak_threshold") ?? "12"), 10);
  const overdue = Number.parseInt(String(formData.get("overdue_threshold") ?? "3"), 10);

  const ok = await updateObligationDensityAlertOrgSettings(
    orgContext.orgId,
    {
      enabled: formData.get("alerts_enabled") === "on",
      weeklyThreshold: Number.isFinite(weekly) ? weekly : 8,
      peakThreshold: Number.isFinite(peak) ? peak : 12,
      overdueThreshold: Number.isFinite(overdue) ? overdue : 3,
      emailEnabled: formData.get("email_enabled") === "on",
    },
    supabase,
  );

  if (!ok) redirect(`${PATH}?error=settings_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
