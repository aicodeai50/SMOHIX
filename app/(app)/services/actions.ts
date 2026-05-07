"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createServiceDependencyForUser,
  deleteServiceDependencyForUser,
} from "@/lib/services/dependencies";
import { createServiceForUser, deleteServiceForUser } from "@/lib/services/data";
import { upsertServiceSloForUser } from "@/lib/services/slo";
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

export async function createServiceDependencyAction(formData: FormData) {
  if (!hasSupabaseAuth()) return;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const serviceId = String(formData.get("service_id") ?? "").trim();
  const dependsOnServiceId = String(formData.get("depends_on_service_id") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "runtime").trim() as
    | "runtime"
    | "data"
    | "network"
    | "auth"
    | "other";
  const criticality = String(formData.get("criticality") ?? "medium").trim() as
    | "low"
    | "medium"
    | "high";

  const result = await createServiceDependencyForUser(supabase, {
    userId: user.id,
    serviceId,
    dependsOnServiceId,
    relationship,
    criticality,
  });
  if (!result.ok) {
    redirect(`/services?error=${encodeURIComponent(result.reason)}`);
  }
  revalidatePath("/services");
  redirect("/services");
}

export async function deleteServiceDependencyAction(formData: FormData) {
  if (!hasSupabaseAuth()) return;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const serviceId = String(formData.get("service_id") ?? "").trim();
  const dependsOnServiceId = String(formData.get("depends_on_service_id") ?? "").trim();

  const result = await deleteServiceDependencyForUser(supabase, {
    userId: user.id,
    serviceId,
    dependsOnServiceId,
  });
  if (!result.ok) {
    redirect(`/services?error=${encodeURIComponent(result.reason)}`);
  }
  revalidatePath("/services");
  redirect("/services");
}

export async function updateServiceSloAction(formData: FormData) {
  if (!hasSupabaseAuth()) return;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const serviceId = String(formData.get("service_id") ?? "").trim();
  const targetPercent = Number(formData.get("target_percent") ?? "");
  const windowDays = Number(formData.get("window_days") ?? 30) as 7 | 30 | 90;
  const enabled = String(formData.get("enabled") ?? "on") === "on";

  const result = await upsertServiceSloForUser(supabase, {
    userId: user.id,
    serviceId,
    targetPercent,
    windowDays,
    enabled,
  });
  if (!result.ok) {
    redirect(`/services?error=${encodeURIComponent(result.reason)}`);
  }
  revalidatePath("/services");
  revalidatePath("/overview");
  revalidatePath("/automations");
  redirect("/services");
}
