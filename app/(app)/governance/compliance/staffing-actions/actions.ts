"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildObligationStaffingActionTrackerPack } from "@/lib/compliance/obligation-staffing-action-tracker";
import {
  acceptStaffingAction,
  updateStaffingActionStatus,
  type StaffingActionStatus,
} from "@/lib/compliance/obligation-staffing-action-tracker";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/staffing-actions";

export async function acceptStaffingActionAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) redirect(`${PATH}?error=no_org`);

  const actionKey = String(formData.get("action_key") ?? "").trim();
  const horizonDays = Number.parseInt(String(formData.get("horizon_days") ?? "90"), 10) || 90;

  const pack = await buildObligationStaffingActionTrackerPack(user.id, {
    orgId: orgContext.orgId,
    horizonDays,
    supabase,
  });
  const item = pack?.items.find((i) => i.proposal.actionKey === actionKey);
  if (!item) redirect(`${PATH}?error=invalid_action`);

  const result = await acceptStaffingAction(user.id, orgContext.orgId, item.proposal, supabase);
  if (!result.ok) {
    redirect(`${PATH}?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath(PATH);
  redirect(`${PATH}?accepted=1`);
}

export async function updateStaffingActionStatusAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) redirect(`${PATH}?error=no_org`);

  const actionId = String(formData.get("action_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as StaffingActionStatus;
  const allowed: StaffingActionStatus[] = [
    "accepted",
    "in_progress",
    "completed",
    "dismissed",
  ];
  if (!actionId || !allowed.includes(status)) {
    redirect(`${PATH}?error=invalid_status`);
  }

  const note = String(formData.get("operator_note") ?? "").trim();

  const ok = await updateStaffingActionStatus(user.id, orgContext.orgId, actionId, status, {
    operatorNote: note.length > 0 ? note : undefined,
    supabase,
  });
  if (!ok) redirect(`${PATH}?error=update_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?updated=1`);
}
