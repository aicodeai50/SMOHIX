"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  createChangeActionForUser,
  createChangeWindowForUser,
  deleteChangeWindowForUser,
} from "@/lib/equipment/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireUser(nextPath: string) {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function createChangeWindowAction(formData: FormData) {
  const user = await requireUser("/changes");
  const result = await createChangeWindowForUser(user.id, {
    title: String(formData.get("title") ?? ""),
    environment: String(formData.get("environment") ?? ""),
    startsAt: String(formData.get("starts_at") ?? ""),
    endsAt: String(formData.get("ends_at") ?? ""),
    riskLevel: String(formData.get("risk_level") ?? "medium"),
    requiresApproval: formData.get("requires_approval") === "on",
    ownerHint: String(formData.get("owner_hint") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!result.ok) {
    redirect(`/changes?error=${encodeURIComponent(result.reason)}`);
  }
  await appendAuditEvent({
    event_type: "change.window.created",
    user_id: user.id,
    details: { title: String(formData.get("title") ?? "").slice(0, 200) },
  });
  revalidatePath("/changes");
  revalidatePath("/audit");
  redirect("/changes");
}

export async function createChangeActionAction(formData: FormData) {
  const user = await requireUser("/changes");
  const result = await createChangeActionForUser(user.id, {
    changeWindowId: String(formData.get("change_window_id") ?? ""),
    actionType: String(formData.get("action_type") ?? ""),
    targetRef: String(formData.get("target_ref") ?? ""),
    status: String(formData.get("status") ?? "planned"),
    executedAt: String(formData.get("executed_at") ?? ""),
  });
  if (!result.ok) {
    redirect(`/changes?error=${encodeURIComponent(result.reason)}`);
  }
  await appendAuditEvent({
    event_type: "change.action.created",
    user_id: user.id,
    details: { action_type: String(formData.get("action_type") ?? "").slice(0, 120) },
  });
  revalidatePath("/changes");
  revalidatePath("/audit");
  redirect("/changes");
}

export async function deleteChangeWindowAction(formData: FormData) {
  if (!hasSupabaseAuth()) return;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  const result = await deleteChangeWindowForUser(user.id, id);
  if (!result.ok) {
    redirect(`/changes?error=${encodeURIComponent(result.reason)}`);
  }
  await appendAuditEvent({
    event_type: "change.window.deleted",
    user_id: user.id,
    details: { id },
  });
  revalidatePath("/changes");
  revalidatePath("/audit");
  redirect("/changes");
}
