"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  runStaffingDigestAutoChain,
  updateStaffingDigestAutoChainOrgSettings,
} from "@/lib/compliance/staffing-digest-auto-chain";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/staffing-digest-auto-chain";

function siteOriginFromEnv(): string {
  return ((process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL) ?? "https://smohix.run").replace(/\/$/, "");
}

export async function runStaffingDigestAutoChainAction(formData: FormData) {
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

  const result = await runStaffingDigestAutoChain(user.id, orgContext.orgId, {
    siteOrigin: siteOriginFromEnv(),
    orgName: orgContext.orgName ?? undefined,
    supabase,
    force,
  });

  if (!result.ok) {
    redirect(`${PATH}?error=${encodeURIComponent(result.reason)}`);
  }

  const sent = result.steps.filter((s) => s.status === "sent").length;
  revalidatePath(PATH);
  redirect(`${PATH}?ran=1&sent=${sent}&period=${encodeURIComponent(result.periodKey)}`);
}

export async function updateStaffingDigestAutoChainSettingsAction(formData: FormData) {
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

  const ok = await updateStaffingDigestAutoChainOrgSettings(
    orgContext.orgId,
    { autoChainEnabled: formData.get("auto_chain_enabled") === "on" },
    supabase,
  );

  if (!ok) redirect(`${PATH}?error=settings_failed`);
  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
