"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { updateIncidentPostmortemForUser, updateIncidentStatusForUser } from "@/lib/incidents/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateIncidentStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) {
    return;
  }

  if (!hasSupabaseAuth()) {
    const tid = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
    const result = await updateIncidentStatusForUser("", id, status, {
      devTenantKey: tid,
    });
    if (!result.ok) {
      redirect(
        `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
      );
    }
    revalidatePath("/incidents");
    revalidatePath(`/incidents/${id}`);
    revalidatePath("/overview");
    redirect(`/incidents/${id}`);
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

  await appendAuditEvent({
    event_type: "incident.status_updated",
    user_id: user.id,
    details: { incident_id: id, status },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  revalidatePath("/overview");
  redirect(`/incidents/${id}`);
}

export async function updateIncidentPostmortemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const postmortem = String(formData.get("postmortem") ?? "");
  if (!id) {
    return;
  }

  if (!hasSupabaseAuth()) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const result = await updateIncidentPostmortemForUser(user.id, id, postmortem);
  if (!result.ok) {
    redirect(
      `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
    );
  }

  await appendAuditEvent({
    event_type: "incident.postmortem_updated",
    user_id: user.id,
    details: { incident_id: id },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  revalidatePath("/overview");
  redirect(`/incidents/${id}`);
}
