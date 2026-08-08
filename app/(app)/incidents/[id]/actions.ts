"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { clearIncidentLegalHold, setIncidentLegalHold } from "@/lib/legal-hold/incident";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { runGuardedRemediation } from "@/lib/automations/remediation";
import {
  createIncidentCommandEvent,
  notifyIncidentResponders,
  type IncidentCommandEventType,
} from "@/lib/incidents/command-loop";
import {
  getIncidentForUser,
  updateIncidentContextForUser,
  updateIncidentPostmortemForUser,
  updateIncidentStatusForUser,
} from "@/lib/incidents/data";
import { createIncidentRcaRun } from "@/lib/incidents/rca";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const COMMAND_EVENT_TYPES = new Set<IncidentCommandEventType>([
  "comment",
  "handoff",
  "copilot_context",
]);

export async function updateIncidentStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) {
    return;
  }

  if (!hasSupabaseAuth()) {
    const tid = ((await cookies()).get("smohix_dev_tid")?.value ?? (await cookies()).get("zentro_dev_tid")?.value) ?? "anon";
    const result = await updateIncidentStatusForUser("", id, status, {
      devTenantKey: tid,
    });
    if (!result.ok) {
      redirect(
        `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
      );
    }
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
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const orgContext = await getOrgContextForUser(user.id);
  const result = await updateIncidentStatusForUser(user.id, id, status);
  if (!result.ok) {
    redirect(
      `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
    );
  }

  await appendAuditEvent({
    event_type: "incident.status_updated",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { incident_id: id, status },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  revalidatePath("/overview");
  redirect(`/incidents/${id}`);
}

export async function updateIncidentContextAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const ownerHint = String(formData.get("owner_hint") ?? "");
  const assignedUserId = String(formData.get("assigned_user_id") ?? "");
  const runbookSlug = String(formData.get("runbook_slug") ?? "");
  if (!id) {
    return;
  }

  if (!hasSupabaseAuth()) {
    const tid = ((await cookies()).get("smohix_dev_tid")?.value ?? (await cookies()).get("zentro_dev_tid")?.value) ?? "anon";
    const result = await updateIncidentContextForUser(
      "",
      id,
      { ownerHint, runbookSlug, assignedUserId },
      { devTenantKey: tid },
    );
    if (!result.ok) {
      redirect(
        `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
      );
    }
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
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const orgContext = await getOrgContextForUser(user.id);
  const result = await updateIncidentContextForUser(user.id, id, {
    ownerHint,
    assignedUserId,
    runbookSlug,
  });
  if (!result.ok) {
    redirect(
      `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
    );
  }

  await appendAuditEvent({
    event_type: "incident.context_updated",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { incident_id: id, assigned_user_id: assignedUserId || null },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  revalidatePath("/overview");
  redirect(`/incidents/${id}`);
}

export async function addIncidentCommandEventAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const rawType = String(formData.get("event_type") ?? "comment").trim();
  const targetUserId = String(formData.get("target_user_id") ?? "").trim() || null;
  const eventType: IncidentCommandEventType = COMMAND_EVENT_TYPES.has(rawType as IncidentCommandEventType)
    ? (rawType as IncidentCommandEventType)
    : "comment";

  if (!id || !body) {
    return;
  }

  if (!hasSupabaseAuth()) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent("Command loop requires Supabase auth.")}`);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const orgContext = await getOrgContextForUser(user.id);
  const result = await createIncidentCommandEvent({
    supabase,
    incidentId: id,
    userId: user.id,
    orgId: orgContext.orgId,
    eventType,
    body,
    targetUserId,
  });

  if (!result.ok) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`);
  }

  const title =
    eventType === "handoff"
      ? "Smohix incident handoff"
      : eventType === "copilot_context"
        ? "Smohix Copilot context snapshot"
        : "Smohix incident update";

  await notifyIncidentResponders({
    supabase,
    incidentId: id,
    orgId: orgContext.orgId,
    actorUserId: user.id,
    targetUserId: eventType === "handoff" ? targetUserId : null,
    kind: `incident.${eventType}`,
    title,
    body,
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
  revalidatePath("/overview");
  redirect(`/incidents/${id}`);
}

export async function updateIncidentPostmortemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const postmortem = String(formData.get("postmortem") ?? "");
  if (!id) {
    return;
  }

  if (!hasSupabaseAuth()) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const orgContext = await getOrgContextForUser(user.id);
  const result = await updateIncidentPostmortemForUser(user.id, id, postmortem);
  if (!result.ok) {
    redirect(
      `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
    );
  }

  await appendAuditEvent({
    event_type: "incident.postmortem_updated",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { incident_id: id },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
  revalidatePath("/overview");
  redirect(`/incidents/${id}`);
}

export async function generateIncidentRcaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return;
  }

  if (!hasSupabaseAuth()) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent("RCA requires Supabase auth.")}`);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const orgContext = await getOrgContextForUser(user.id);
  const resolved = await getIncidentForUser(user.id, id, null);
  if (!resolved || resolved.source !== "database") {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent("Incident not found.")}`);
  }

  const run = await createIncidentRcaRun({
    supabase,
    userId: user.id,
    incident: resolved.row,
  });
  if (!run) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent("Could not generate RCA.")}`);
  }

  await appendAuditEvent({
    event_type: "incident.rca_generated",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      incident_id: id,
      confidence_score: run.confidenceScore,
      evidence_count: run.evidenceRefs.length,
      rca_run_id: run.id,
    },
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/incidents");
  revalidatePath("/overview");
  redirect(`/incidents/${id}`);
}

export async function runIncidentRemediationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  if (!hasSupabaseAuth()) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent("Remediation requires Supabase auth.")}`);
  }

  const playbookId = String(formData.get("playbook_id") ?? "").trim() || "pb-restart-workers";
  const approvalNote =
    String(formData.get("approval_note") ?? "").trim() ||
    "two-person approval | change window | senior on-call acknowledged";
  const rollbackPlan =
    String(formData.get("rollback_plan") ?? "").trim() ||
    "Rollback by restoring last stable release and validating service health checks.";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const orgContext = await getOrgContextForUser(user.id);

  const result = await runGuardedRemediation({
    supabase,
    userId: user.id,
    playbookId,
    approvalNote,
    rollbackPlan,
    incidentId: id,
    triggerSource: "incident",
    orgId: orgContext.orgId,
  });

  await appendAuditEvent({
    event_type: result.ok ? "automation.remediation_executed" : "automation.remediation_blocked",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      incident_id: id,
      playbook_id: playbookId,
      remediation_run_id: result.runId,
      blocked_reason: result.blockedReason,
      checks: result.checks,
    },
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/overview");
  if (result.ok) {
    redirect(`/incidents/${id}?remediation=1`);
  }
  redirect(
    `/incidents/${id}?error=${encodeURIComponent(
      result.blockedReason ?? "Remediation blocked by guardrails.",
    )}`,
  );
}

export async function setIncidentLegalHoldAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) return;

  if (!hasSupabaseAuth()) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent("Legal hold requires Supabase.")}`);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const orgContext = await getOrgContextForUser(user.id);
  if (orgContext.orgId && orgContext.role && !canManageMembers(orgContext.role)) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=rbac`);
  }

  const result = await setIncidentLegalHold(user.id, id, {
    orgId: orgContext.orgId,
    reason,
  });
  if (!result.ok) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.legal_hold_set",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { incident_id: id, reason: reason.slice(0, 240) },
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/governance/legal-holds");
  redirect(`/incidents/${encodeURIComponent(id)}?hold=1`);
}

export async function clearIncidentLegalHoldAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  if (!hasSupabaseAuth()) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
  }

  const orgContext = await getOrgContextForUser(user.id);
  if (orgContext.orgId && orgContext.role && !canManageMembers(orgContext.role)) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=rbac`);
  }

  const result = await clearIncidentLegalHold(user.id, id, { orgId: orgContext.orgId });
  if (!result.ok) {
    redirect(`/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "governance.legal_hold_cleared",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { incident_id: id },
  });

  revalidatePath(`/incidents/${id}`);
  revalidatePath("/governance/legal-holds");
  redirect(`/incidents/${encodeURIComponent(id)}?hold_cleared=1`);
}
