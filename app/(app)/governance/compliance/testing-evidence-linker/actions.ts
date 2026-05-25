"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildControlTestingEvidenceLinkerPack,
  materializeTestingEvidenceLinksForExport,
} from "@/lib/compliance/control-testing-evidence-linker";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function materializeTestingLinksAction() {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/testing-evidence-linker");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/testing-evidence-linker");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/testing-evidence-linker?error=rbac");
  }

  const pack = await buildControlTestingEvidenceLinkerPack(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    supabase,
  });

  if (!pack) {
    redirect("/governance/compliance/testing-evidence-linker?error=build_failed");
  }

  await materializeTestingEvidenceLinksForExport(user.id, orgContext.orgId, pack);

  revalidatePath("/governance/compliance/testing-evidence-linker");
  redirect("/governance/compliance/testing-evidence-linker?linked=1");
}
