"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createApprovalRequest } from "@/lib/approvals/data";
import { devDecideApproval } from "@/lib/approvals/dev-store";
import { evaluateApprovalPolicy } from "@/lib/approvals/policy";
import { appendAuditEvent } from "@/lib/audit/append";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createApprovalRequestAction(formData: FormData) {
  const actionLabel = String(formData.get("action_label") ?? "");
  const requestedBy = String(formData.get("requested_by") ?? "");
  const policyHint = String(formData.get("policy_hint") ?? "");
  const policy = evaluateApprovalPolicy(actionLabel, policyHint);

  if (policy.blockedReason) {
    redirect(
      `/approvals?error=create&message=${encodeURIComponent(policy.blockedReason)}`,
    );
  }

  let userId = "";
  let devTenantId: string | null = null;
  let auditUserId: string | null = null;

  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/approvals");
    }
    userId = user.id;
    auditUserId = user.id;
  } else {
    devTenantId = (await cookies()).get("shynvo_dev_tid")?.value ?? null;
  }

  const result = await createApprovalRequest({
    userId,
    devTenantId,
    actionLabel,
    requestedBy,
    policyHint: policy.normalizedPolicyHint,
  });

  if (!result.ok) {
    redirect(
      `/approvals?error=create&message=${encodeURIComponent(result.reason)}`,
    );
  }

  if (auditUserId) {
    void appendAuditEvent({
      event_type: "approval.requested",
      user_id: auditUserId,
      details: {
        approval_id: result.id,
        action_label: actionLabel.trim().slice(0, 200),
      },
    });
  }

  revalidatePath("/approvals");
  revalidatePath("/overview");
  redirect("/approvals?created=1");
}

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
      redirect("/approvals?error=no_session");
    }
    const r = devDecideApproval(tid, id, decision);
    if (!r.ok) {
      redirect("/approvals?error=not_found");
    }
    revalidatePath("/approvals");
    revalidatePath("/overview");
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
  revalidatePath("/overview");
}
