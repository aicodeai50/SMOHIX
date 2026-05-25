"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createApprovalRequest } from "@/lib/approvals/data";
import { devDecideApproval } from "@/lib/approvals/dev-store";
import { evaluateApprovalPolicy } from "@/lib/approvals/policy";
import { appendAuditEvent } from "@/lib/audit/append";
import { buildDecisionBrief } from "@/lib/decision-intelligence";
import { sendSlackNotificationWithAudit } from "@/lib/integrations/slack";
import { getOrgContextForUser } from "@/lib/org/context";
import { canCreateApprovalRequest, canDecideApproval } from "@/lib/org/roles";
import { getSiteUrl } from "@/lib/site";
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
  let orgId: string | null = null;

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

    const orgContext = await getOrgContextForUser(user.id);
    if (orgContext.orgId && orgContext.role) {
      if (!canCreateApprovalRequest(orgContext.role)) {
        redirect("/approvals?error=rbac&message=Your+org+role+cannot+create+approval+requests.");
      }
      orgId = orgContext.orgId;
    }
  } else {
    devTenantId = (await cookies()).get("zentro_dev_tid")?.value ?? null;
  }

  const result = await createApprovalRequest({
    userId,
    devTenantId,
    actionLabel,
    requestedBy,
    policyHint: policy.normalizedPolicyHint,
    orgId,
  });

  if (!result.ok) {
    redirect(
      `/approvals?error=create&message=${encodeURIComponent(result.reason)}`,
    );
  }

  if (auditUserId) {
    const brief = buildDecisionBrief({
      actionLabel: actionLabel.trim(),
      policyHint: policy.normalizedPolicyHint,
    });
    void appendAuditEvent({
      event_type: "approval.requested",
      user_id: auditUserId,
      org_id: orgId,
      details: {
        approval_id: result.id,
        action_label: actionLabel.trim().slice(0, 200),
        decision_brief: brief,
        org_id: orgId,
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
    const tid = (await cookies()).get("zentro_dev_tid")?.value;
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

  const orgContext = await getOrgContextForUser(user.id);

  const existingQuery = supabase
    .from("approval_requests")
    .select("action_label, policy_hint, decision_brief_json, org_id, requester_id, user_id, status")
    .eq("id", id)
    .eq("status", "pending");

  const { data: existing } = orgContext.orgId
    ? await existingQuery.or(`org_id.eq.${orgContext.orgId},and(org_id.is.null,user_id.eq.${user.id})`).maybeSingle()
    : await existingQuery.eq("user_id", user.id).maybeSingle();

  if (!existing) {
    redirect("/approvals?error=not_found");
  }

  const brief = buildDecisionBrief({
    actionLabel: String(existing.action_label ?? "approval"),
    policyHint: String(existing.policy_hint ?? ""),
  });

  const requesterId =
    (existing.requester_id as string | null) ?? (existing.user_id as string | null);
  const orgId = existing.org_id as string | null;

  if (orgId && orgContext.orgId === orgId && orgContext.role) {
    if (!canDecideApproval(orgContext.role, brief.riskScore)) {
      redirect("/approvals?error=rbac&message=Your+org+role+cannot+decide+this+request.");
    }
    if (requesterId === user.id) {
      redirect("/approvals?error=self_approval");
    }
  }

  const updated_at = new Date().toISOString();
  let updateQuery = supabase
    .from("approval_requests")
    .update({
      status: decision,
      updated_at,
      decision_brief_json: brief,
      decided_by: user.id,
    })
    .eq("id", id)
    .eq("status", "pending");

  if (orgId) {
    updateQuery = updateQuery.eq("org_id", orgId);
  } else {
    updateQuery = updateQuery.eq("user_id", user.id);
  }

  const { data, error } = await updateQuery.select("id").maybeSingle();

  if (error || !data) {
    redirect("/approvals?error=update_failed");
  }

  await appendAuditEvent({
    event_type: decision === "approved" ? "approval.approved" : "approval.denied",
    user_id: user.id,
    org_id: orgId,
    details: { approval_id: id, decision_brief: brief, org_id: orgId, decided_by: user.id },
  });
  const approvalUrl = `${getSiteUrl()}/approvals`;
  void sendSlackNotificationWithAudit({
    userId: user.id,
    title: `Approval ${decision}`,
    body: `An approval request was ${decision} in Zentro.`,
    details: [`approval_id: ${id}`, `open: ${approvalUrl}`],
    kind: "approval_decision",
    auditDetails: { approval_id: id, decision },
  });

  revalidatePath("/approvals");
  revalidatePath("/overview");
}
