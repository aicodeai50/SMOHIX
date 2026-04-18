"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { recordDevIncident } from "@/lib/incidents/dev-store";
import { createIncidentForUser } from "@/lib/incidents/data";
import type { IncidentSeverity } from "@/lib/incidents/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const SEVERITIES = new Set<IncidentSeverity>(["low", "medium", "high", "critical"]);

export async function createIncidentAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const severityRaw = String(formData.get("severity") ?? "medium");
  const status = String(formData.get("status") ?? "investigating");
  const severity = SEVERITIES.has(severityRaw as IncidentSeverity)
    ? (severityRaw as IncidentSeverity)
    : "medium";

  if (!hasSupabaseAuth()) {
    const tid = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
    if (!title.trim()) {
      redirect(`/incidents/new?error=${encodeURIComponent("Title is required.")}`);
    }
    const id = recordDevIncident(tid, { title, severity, status });
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
    redirect("/auth/sign-in?next=/incidents/new");
  }

  const result = await createIncidentForUser(user.id, { title, severity, status });
  if (!result.ok) {
    redirect(`/incidents/new?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${result.id}`);
  revalidatePath("/overview");
  redirect(`/incidents/${result.id}`);
}
