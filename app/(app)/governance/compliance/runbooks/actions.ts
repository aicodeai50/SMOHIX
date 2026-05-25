"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  startGapRemediation,
  updateGapRemediationStatus,
  type GapRemediationStatus,
} from "@/lib/compliance/gap-remediation";
import type { ProgramGapRow } from "@/lib/compliance/program-dashboard";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function parseGapFromForm(formData: FormData): ProgramGapRow | null {
  const framework = String(formData.get("framework") ?? "").trim();
  const controlRef = String(formData.get("control_ref") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const allowed = [
    "soc2",
    "iso27001",
    "pcidss",
    "hipaa",
    "nist_csf",
    "cis_v8",
    "cmmc_l2",
    "gdpr_art32",
  ] as const;
  if (!allowed.includes(framework as ProgramGapRow["framework"]) || !controlRef || !title) {
    return null;
  }
  return {
    framework: framework as ProgramGapRow["framework"],
    controlRef,
    title,
    reason: reason || "Assessment exception",
  };
}

export async function trackGapRunbookAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/runbooks");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/runbooks");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) redirect("/governance/compliance/runbooks?error=no_org");

  const gap = parseGapFromForm(formData);
  if (!gap) redirect("/governance/compliance/runbooks?error=invalid_gap");

  const runbookSlug = String(formData.get("runbook_slug") ?? "").trim() || undefined;
  const playbookRaw = String(formData.get("playbook_id") ?? "").trim();
  const playbookId = playbookRaw.length > 0 ? playbookRaw : null;

  const result = await startGapRemediation(user.id, orgContext.orgId, gap, {
    runbookSlug,
    playbookId,
  }, supabase);
  if (!result.ok) {
    redirect(`/governance/compliance/runbooks?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/governance/compliance/runbooks");
  revalidatePath("/governance/compliance/program");
  redirect("/governance/compliance/runbooks?tracked=1");
}

export async function updateGapRunbookStatusAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect("/governance/compliance/runbooks");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/governance/compliance/runbooks");

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) redirect("/governance/compliance/runbooks?error=no_org");

  const remediationId = String(formData.get("remediation_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as GapRemediationStatus;
  const allowed: GapRemediationStatus[] = ["open", "in_progress", "resolved", "dismissed"];
  if (!remediationId || !allowed.includes(status)) {
    redirect("/governance/compliance/runbooks?error=invalid_status");
  }

  const ok = await updateGapRemediationStatus(
    user.id,
    orgContext.orgId,
    remediationId,
    status,
    supabase,
  );
  if (!ok) redirect("/governance/compliance/runbooks?error=update_failed");

  revalidatePath("/governance/compliance/runbooks");
  revalidatePath("/governance/compliance/program");
  redirect("/governance/compliance/runbooks?updated=1");
}
