"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { createNetworkDeviceForUser, deleteNetworkDeviceForUser } from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createNetworkDeviceAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/assets/network");
  }

  const result = await createNetworkDeviceForUser(user.id, {
    hostname: String(formData.get("hostname") ?? ""),
    deviceRole: String(formData.get("device_role") ?? ""),
    vendor: String(formData.get("vendor") ?? ""),
    model: String(formData.get("model") ?? ""),
    serialNumber: String(formData.get("serial_number") ?? ""),
    mgmtIp: String(formData.get("mgmt_ip") ?? ""),
    site: String(formData.get("site") ?? ""),
    environment: String(formData.get("environment") ?? ""),
    firmwareVersion: String(formData.get("firmware_version") ?? ""),
    ownerHint: String(formData.get("owner_hint") ?? ""),
  });
  if (!result.ok) {
    redirect(`/assets/network?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "equipment.network_device.created",
    user_id: user.id,
    details: { hostname: String(formData.get("hostname") ?? "").slice(0, 200) },
  });

  revalidatePath("/assets/network");
  revalidatePath("/audit");
  redirect("/assets/network");
}

export async function deleteNetworkDeviceAction(formData: FormData) {
  if (!hasSupabaseAuth()) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  const result = await deleteNetworkDeviceForUser(user.id, id);
  if (!result.ok) {
    redirect(`/assets/network?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "equipment.network_device.deleted",
    user_id: user.id,
    details: { id },
  });

  revalidatePath("/assets/network");
  revalidatePath("/audit");
  redirect("/assets/network");
}
