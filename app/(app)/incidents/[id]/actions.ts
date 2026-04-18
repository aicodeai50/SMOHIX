"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateIncidentStatusForUser } from "@/lib/incidents/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateIncidentStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const result = await updateIncidentStatusForUser(user.id, id, status);
  if (!result.ok) {
    redirect(
      `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
    );
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  redirect(`/incidents/${id}`);
}
