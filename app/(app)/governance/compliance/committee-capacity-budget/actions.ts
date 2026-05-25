"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateCommitteeCapacityBudgetOrgSettings } from "@/lib/compliance/committee-obligation-capacity-budget";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/committee-capacity-budget";

export async function updateCommitteeCapacityBudgetSettingsAction(formData: FormData) {
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

  const hoursPerObligation = Number.parseFloat(
    String(formData.get("hours_per_obligation") ?? "2"),
  );
  const ownerHoursPerWeek = Number.parseFloat(
    String(formData.get("owner_hours_per_week") ?? "8"),
  );

  const ok = await updateCommitteeCapacityBudgetOrgSettings(
    orgContext.orgId,
    {
      hoursPerObligation: Number.isFinite(hoursPerObligation) ? hoursPerObligation : 2,
      ownerHoursPerWeek: Number.isFinite(ownerHoursPerWeek) ? ownerHoursPerWeek : 8,
    },
    supabase,
  );

  if (!ok) redirect(`${PATH}?error=settings_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?saved=1`);
}
