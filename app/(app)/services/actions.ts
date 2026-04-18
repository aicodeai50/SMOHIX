"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServiceForUser, deleteServiceForUser } from "@/lib/services/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createServiceAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/services");
  }

  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const environment = String(formData.get("environment") ?? "");
  const ownerHint = String(formData.get("owner_hint") ?? "");

  const result = await createServiceForUser(user.id, {
    name,
    description,
    environment,
    ownerHint,
  });

  if (!result.ok) {
    redirect(`/services?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/services");
  revalidatePath("/incidents/new");
  redirect("/services");
}

export async function deleteServiceAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const result = await deleteServiceForUser(user.id, id);
  if (!result.ok) {
    redirect(`/services?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/services");
  revalidatePath("/incidents/new");
  redirect("/services");
}
