"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import { runGuardedRemediation } from "@/lib/automations/remediation";
import {
  getIncidentForUser,
  updateIncidentContextForUser,
  updateIncidentPostmortemForUser,
  updateIncidentStatusForUser,
} from "@/lib/incidents/data";
import { createIncidentRcaRun } from "@/lib/incidents/rca";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateIncidentStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) {
    return;
  }

  if (!hasSupabaseAuth()) {
    const tid = (await cookies()).get("zentro_dev_tid")?.value ?? "anon";
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

  const result = await updateIncidentStatusForUser(user.id, id, status);
  if (!result.ok) {
    redirect(
      `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
    );
  }

  await appendAuditEvent({
    event_type: "incident.status_updated",
    user_id: user.id,
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
  const runbookSlug = String(formData.get("runbook_slug") ?? "");
  if (!id) {
    return;
  }

  if (!hasSupabaseAuth()) {
    const tid = (await cookies()).get("zentro_dev_tid")?.value ?? "anon";
    const result = await updateIncidentContextForUser(
      "",
      id,
      { ownerHint, runbookSlug },
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

  const result = await updateIncidentContextForUser(user.id, id, {
    ownerHint,
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
    details: { incident_id: id },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${id}`);
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

  const result = await updateIncidentPostmortemForUser(user.id, id, postmortem);
  if (!result.ok) {
    redirect(
      `/incidents/${encodeURIComponent(id)}?error=${encodeURIComponent(result.reason)}`,
    );
  }

  await appendAuditEvent({
    event_type: "incident.postmortem_updated",
    user_id: user.id,
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

  const result = await runGuardedRemediation({
    supabase,
    userId: user.id,
    playbookId,
    approvalNote,
    rollbackPlan,
    incidentId: id,
    triggerSource: "incident",
  });

  await appendAuditEvent({
    event_type: result.ok ? "automation.remediation_executed" : "automation.remediation_blocked",
    user_id: user.id,
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
