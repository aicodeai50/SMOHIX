"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildObligationCrossoverReportPack } from "@/lib/compliance/obligation-crossover-report";
import {
  startConsolidationPlay,
  updateConsolidationPlayStatus,
  type ConsolidationPlayStatus,
} from "@/lib/compliance/obligation-consolidation-playbook";
import { getOrgContextForUser } from "@/lib/org/context";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const CONSOLIDATION_PATH = "/governance/compliance/obligation-consolidation";

export async function startConsolidationPlayAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(CONSOLIDATION_PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${CONSOLIDATION_PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) redirect(`${CONSOLIDATION_PATH}?error=no_org`);

  const clusterId = String(formData.get("cluster_id") ?? "").trim();
  const horizonRaw = String(formData.get("horizon_days") ?? "90");
  const horizonDays = Number.parseInt(horizonRaw, 10) || 90;
  const runbookSlug = String(formData.get("runbook_slug") ?? "").trim() || undefined;
  const playbookRaw = String(formData.get("playbook_id") ?? "").trim();
  const playbookId = playbookRaw.length > 0 ? playbookRaw : null;

  const crossover = await buildObligationCrossoverReportPack(user.id, {
    orgId: orgContext.orgId,
    horizonDays,
    supabase,
  });
  const cluster = crossover?.clusters.find((c) => c.id === clusterId);
  if (!cluster) redirect(`${CONSOLIDATION_PATH}?error=invalid_cluster`);

  const result = await startConsolidationPlay(user.id, orgContext.orgId, cluster, {
    runbookSlug,
    playbookId,
    supabase,
  });
  if (!result.ok) {
    redirect(`${CONSOLIDATION_PATH}?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath(CONSOLIDATION_PATH);
  revalidatePath("/governance/compliance/obligation-crossover");
  redirect(`${CONSOLIDATION_PATH}?started=1`);
}

export async function updateConsolidationPlayStatusAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(CONSOLIDATION_PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${CONSOLIDATION_PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) redirect(`${CONSOLIDATION_PATH}?error=no_org`);

  const playId = String(formData.get("play_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ConsolidationPlayStatus;
  const allowed: ConsolidationPlayStatus[] = [
    "planned",
    "in_progress",
    "collected",
    "verified",
    "dismissed",
  ];
  if (!playId || !allowed.includes(status)) {
    redirect(`${CONSOLIDATION_PATH}?error=invalid_status`);
  }

  const operatorNote = String(formData.get("operator_note") ?? "").trim();
  const ok = await updateConsolidationPlayStatus(user.id, orgContext.orgId, playId, status, {
    operatorNote: operatorNote.length > 0 ? operatorNote : undefined,
    supabase,
  });
  if (!ok) redirect(`${CONSOLIDATION_PATH}?error=update_failed`);

  revalidatePath(CONSOLIDATION_PATH);
  redirect(`${CONSOLIDATION_PATH}?updated=1`);
}
