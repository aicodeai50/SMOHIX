"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { hasMaxBlastToken, parseMaxBlastScope } from "@/lib/approvals/policy-scope";
import { invalidMaxBlastRedirectPath } from "@/lib/approvals/policy-review-url";
import { updatePolicySuggestionStatus } from "@/lib/approvals/policy-suggestions";
import { getOrgContextForUser } from "@/lib/org/context";
import { canReviewPolicy } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function currentUserIdOrRedirect() {
  if (!hasSupabaseAuth()) {
    redirect("/hub");
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/governance/policies");
  }
  return { supabase, userId: user.id };
}

export async function reviewPolicySuggestionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim() as "accepted" | "rejected";
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id || (decision !== "accepted" && decision !== "rejected")) {
    return;
  }
  if (decision === "accepted" && hasMaxBlastToken(notes) && !parseMaxBlastScope(notes)) {
    redirect(invalidMaxBlastRedirectPath({ suggestionId: id, notes }));
  }
  const { supabase, userId } = await currentUserIdOrRedirect();
  const orgContext = await getOrgContextForUser(userId);
  if (orgContext.orgId && orgContext.role && !canReviewPolicy(orgContext.role)) {
    redirect("/governance/policies?error=rbac");
  }
  const ok = await updatePolicySuggestionStatus(supabase, {
    userId,
    id,
    status: decision,
    reviewerNotes: notes,
  });
  if (!ok) {
    redirect("/governance/policies?error=not_found");
  }
  await appendAuditEvent({
    event_type: decision === "accepted" ? "policy.suggestion_accepted" : "policy.suggestion_rejected",
    user_id: userId,
    org_id: orgContext.orgId,
    details: { policy_suggestion_id: id, notes: notes.slice(0, 240) },
  });
  revalidatePath("/governance/policies");
  revalidatePath("/overview");
}
