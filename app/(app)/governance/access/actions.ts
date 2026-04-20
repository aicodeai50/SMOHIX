"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  createAccessRuleForUser,
  createAccessSnapshotForUser,
  deleteAccessRuleForUser,
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

export async function createAccessRuleAction(formData: FormData) {
  const user = await requireUser("/governance/access");
  const result = await createAccessRuleForUser(user.id, {
    ruleName: String(formData.get("rule_name") ?? ""),
    minMfaCoveragePercent: String(formData.get("min_mfa_coverage_percent") ?? ""),
    blockHighRiskWithoutApproval: formData.get("block_high_risk_without_approval") === "on",
    enabled: formData.get("enabled") !== "off",
  });
  if (!result.ok) {
    redirect(`/governance/access?error=${encodeURIComponent(result.reason)}`);
  }
  await appendAuditEvent({
    event_type: "governance.access_rule.created",
    user_id: user.id,
    details: { rule_name: String(formData.get("rule_name") ?? "").slice(0, 200) },
  });
  revalidatePath("/governance/access");
  revalidatePath("/audit");
  redirect("/governance/access");
}

export async function createAccessSnapshotAction(formData: FormData) {
  const user = await requireUser("/governance/access");
  const result = await createAccessSnapshotForUser(user.id, {
    capturedAt: String(formData.get("captured_at") ?? ""),
    mfaCoveragePercent: String(formData.get("mfa_coverage_percent") ?? ""),
    privilegedAccountsTotal: String(formData.get("privileged_accounts_total") ?? ""),
    privilegedAccountsMfaEnabled: String(formData.get("privileged_accounts_mfa_enabled") ?? ""),
    stalePrivilegedAccounts: String(formData.get("stale_privileged_accounts") ?? ""),
    sourceSystem: String(formData.get("source_system") ?? ""),
  });
  if (!result.ok) {
    redirect(`/governance/access?error=${encodeURIComponent(result.reason)}`);
  }
  await appendAuditEvent({
    event_type: "governance.access_snapshot.created",
    user_id: user.id,
    details: { source_system: String(formData.get("source_system") ?? "").slice(0, 120) },
  });
  revalidatePath("/governance/access");
  revalidatePath("/audit");
  redirect("/governance/access");
}

export async function deleteAccessRuleAction(formData: FormData) {
  if (!hasSupabaseAuth()) return;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "").trim();
  const result = await deleteAccessRuleForUser(user.id, id);
  if (!result.ok) {
    redirect(`/governance/access?error=${encodeURIComponent(result.reason)}`);
  }
  await appendAuditEvent({
    event_type: "governance.access_rule.deleted",
    user_id: user.id,
    details: { id },
  });
  revalidatePath("/governance/access");
  revalidatePath("/audit");
  redirect("/governance/access");
}
