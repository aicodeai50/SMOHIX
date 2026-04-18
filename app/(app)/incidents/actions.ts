"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createIncidentForUser } from "@/lib/incidents/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createIncidentAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/incidents/new");
  }

  const title = String(formData.get("title") ?? "");
  const severity = String(formData.get("severity") ?? "medium");
  const status = String(formData.get("status") ?? "investigating");

  const result = await createIncidentForUser(user.id, { title, severity, status });
  if (!result.ok) {
    redirect(`/incidents/new?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${result.id}`);
  redirect(`/incidents/${result.id}`);
}
