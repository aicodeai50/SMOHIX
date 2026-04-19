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
  const serviceIdRaw = String(formData.get("service_id") ?? "").trim();
  const ownerHintRaw = String(formData.get("owner_hint") ?? "").trim();
  const runbookSlugRaw = String(formData.get("runbook_slug") ?? "").trim();
  const severity = SEVERITIES.has(severityRaw as IncidentSeverity)
    ? (severityRaw as IncidentSeverity)
    : "medium";

  if (!hasSupabaseAuth()) {
    const tid = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
    if (!title.trim()) {
      redirect(`/incidents/new?error=${encodeURIComponent("Title is required.")}`);
    }
    const id = recordDevIncident(tid, {
      title,
      severity,
      status,
      ownerHint: ownerHintRaw || null,
      runbookSlug: runbookSlugRaw || null,
    });
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

  const result = await createIncidentForUser(user.id, {
    title,
    severity,
    status,
    serviceId: serviceIdRaw.length > 0 ? serviceIdRaw : null,
    ownerHint: ownerHintRaw.length > 0 ? ownerHintRaw : null,
    runbookSlug: runbookSlugRaw.length > 0 ? runbookSlugRaw : null,
  });
  if (!result.ok) {
    redirect(`/incidents/new?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${result.id}`);
  revalidatePath("/overview");
  redirect(`/incidents/${result.id}`);
}
