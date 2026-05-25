"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  deliverStaffingCompletionRollup,
  updateStaffingCompletionRollupOrgSettings,
} from "@/lib/compliance/staffing-completion-rollup";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/staffing-completion-rollup";

function siteOriginFromEnv(): string {
  return (process.env.ZENTRO_SITE_URL ?? "https://zentro.run").replace(/\/$/, "");
}

export async function deliverStaffingCompletionRollupAction(formData: FormData) {
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

  const result = await deliverStaffingCompletionRollup(user.id, orgContext.orgId, {
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
    `${PATH}?delivered=1&emails=${result.emailsSent}&completion=${result.pack.completionPercent}`,
  );
}

export async function updateStaffingCompletionRollupSettingsAction(formData: FormData) {
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

  const ok = await updateStaffingCompletionRollupOrgSettings(
    orgContext.orgId,
    {
      rollupEnabled: formData.get("rollup_enabled") === "on",
      emailEnabled: formData.get("email_enabled") === "on",
    },
    supabase,
  );

  if (!ok) redirect(`${PATH}?error=settings_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
