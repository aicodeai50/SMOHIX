"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { createSecretForUser, deleteSecretForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createSecretAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/assets/secrets");
  }

  const result = await createSecretForUser(user.id, {
    name: String(formData.get("name") ?? ""),
    secretType: String(formData.get("secret_type") ?? "api_key"),
    environment: String(formData.get("environment") ?? ""),
    rotationPolicyDays: String(formData.get("rotation_policy_days") ?? ""),
    lastRotatedAt: String(formData.get("last_rotated_at") ?? ""),
    nextRotateAt: String(formData.get("next_rotate_at") ?? ""),
    ownerHint: String(formData.get("owner_hint") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!result.ok) {
    redirect(`/assets/secrets?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "equipment.secret.created",
    user_id: user.id,
    details: { name: String(formData.get("name") ?? "").slice(0, 200) },
  });

  revalidatePath("/assets/secrets");
  revalidatePath("/audit");
  redirect("/assets/secrets");
}

export async function deleteSecretAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  const result = await deleteSecretForUser(user.id, id);
  if (!result.ok) {
    redirect(`/assets/secrets?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "equipment.secret.deleted",
    user_id: user.id,
    details: { id },
  });

  revalidatePath("/assets/secrets");
  revalidatePath("/audit");
  redirect("/assets/secrets");
}
