"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { devDecideApproval } from "@/lib/approvals/dev-store";
import { appendAuditEvent } from "@/lib/audit/append";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function approvalDecisionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim() as
    | "approved"
    | "denied";
  if (!id || (decision !== "approved" && decision !== "denied")) {
    return;
  }

  if (!hasSupabaseAuth()) {
    const tid = (await cookies()).get("shynvo_dev_tid")?.value;
    if (!tid) {
      redirect("/approvals?error=no_demo_session");
    }
    const r = devDecideApproval(tid, id, decision);
    if (!r.ok) {
      redirect("/approvals?error=not_found");
    }
    revalidatePath("/approvals");
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/approvals");
  }

  const updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("approval_requests")
    .update({ status: decision, updated_at })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect("/approvals?error=update_failed");
  }

  await appendAuditEvent({
    event_type: decision === "approved" ? "approval.approved" : "approval.denied",
    user_id: user.id,
    details: { approval_id: id },
  });

  revalidatePath("/approvals");
}
