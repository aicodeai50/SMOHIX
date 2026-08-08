"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { runComplianceSlaRemindersForOrg } from "@/lib/compliance/compliance-sla-reminders";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function siteOriginFromEnv(): string {
  return ((process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL) ?? "https://smohix.run").replace(/\/$/, "");
}

export async function runSlaRemindersAction() {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/sla-reminders");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/sla-reminders");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/sla-reminders?error=rbac");
  }

  const result = await runComplianceSlaRemindersForOrg(user.id, orgContext.orgId, {
    siteOrigin: siteOriginFromEnv(),
    supabase,
  });

  if (!result.ok) {
    redirect(`/governance/compliance/sla-reminders?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.compliance_sla_reminders_sent",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      slack_sent: result.slackSent,
      emails_sent: result.emailsSent,
      items_considered: result.itemsConsidered,
    },
  });

  revalidatePath("/governance/compliance/sla-reminders");
  redirect(
    `/governance/compliance/sla-reminders?sent=1&slack=${result.slackSent ? "1" : "0"}&emails=${result.emailsSent}`,
  );
}

export async function updateSlaReminderSettingsAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/sla-reminders");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/sla-reminders");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/governance/compliance/sla-reminders?error=rbac");
  }

  const enabled = formData.get("compliance_sla_reminders_enabled") === "on";
  const emailEnabled = formData.get("compliance_sla_email_enabled") === "on";
  const dueRaw = Number.parseInt(String(formData.get("compliance_sla_due_days_before") ?? "7"), 10);
  const dueDaysBefore = Number.isFinite(dueRaw) ? Math.min(30, Math.max(1, dueRaw)) : 7;

  const { error } = await supabase
    .from("organizations")
    .update({
      compliance_sla_reminders_enabled: enabled,
      compliance_sla_email_enabled: emailEnabled,
      compliance_sla_due_days_before: dueDaysBefore,
    })
    .eq("id", orgContext.orgId);

  if (error) {
    redirect(`/governance/compliance/sla-reminders?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/governance/compliance/sla-reminders");
  redirect("/governance/compliance/sla-reminders?saved=1");
}
