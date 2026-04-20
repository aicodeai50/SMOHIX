"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { createBackupPolicyForUser, deleteBackupPolicyForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createBackupPolicyAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/resilience/backups");
  }

  const result = await createBackupPolicyForUser(user.id, {
    name: String(formData.get("name") ?? ""),
    assetScope: String(formData.get("asset_scope") ?? ""),
    rpoTargetMinutes: String(formData.get("rpo_target_minutes") ?? ""),
    rtoTargetMinutes: String(formData.get("rto_target_minutes") ?? ""),
    retentionDays: String(formData.get("retention_days") ?? ""),
    ownerHint: String(formData.get("owner_hint") ?? ""),
  });
  if (!result.ok) {
    redirect(`/resilience/backups?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "equipment.backup_policy.created",
    user_id: user.id,
    details: { name: String(formData.get("name") ?? "").slice(0, 200) },
  });

  revalidatePath("/resilience/backups");
  revalidatePath("/audit");
  redirect("/resilience/backups");
}

export async function deleteBackupPolicyAction(formData: FormData) {
  if (!hasSupabaseAuth()) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  const result = await deleteBackupPolicyForUser(user.id, id);
  if (!result.ok) {
    redirect(`/resilience/backups?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "equipment.backup_policy.deleted",
    user_id: user.id,
    details: { id },
  });

  revalidatePath("/resilience/backups");
  revalidatePath("/audit");
  redirect("/resilience/backups");
}
