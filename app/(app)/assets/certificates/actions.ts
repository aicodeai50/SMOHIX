"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { createCertificateForUser, deleteCertificateForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createCertificateAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/assets/certificates");
  }

  const result = await createCertificateForUser(user.id, {
    name: String(formData.get("name") ?? ""),
    environment: String(formData.get("environment") ?? ""),
    cn: String(formData.get("cn") ?? ""),
    sans: String(formData.get("sans") ?? ""),
    issuer: String(formData.get("issuer") ?? ""),
    expiresAt: String(formData.get("expires_at") ?? ""),
    ownerHint: String(formData.get("owner_hint") ?? ""),
    autoRenew: formData.get("auto_renew") === "on",
    notes: String(formData.get("notes") ?? ""),
  });

  if (!result.ok) {
    redirect(`/assets/certificates?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "equipment.certificate.created",
    user_id: user.id,
    details: { name: String(formData.get("name") ?? "").slice(0, 200) },
  });

  revalidatePath("/assets/certificates");
  revalidatePath("/audit");
  redirect("/assets/certificates");
}

export async function deleteCertificateAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  const result = await deleteCertificateForUser(user.id, id);
  if (!result.ok) {
    redirect(`/assets/certificates?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "equipment.certificate.deleted",
    user_id: user.id,
    details: { id },
  });

  revalidatePath("/assets/certificates");
  revalidatePath("/audit");
  redirect("/assets/certificates");
}
