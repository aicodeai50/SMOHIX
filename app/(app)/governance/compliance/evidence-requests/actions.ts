"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cancelAssessorEvidenceRequest,
  createAssessorEvidenceRequest,
  fulfillAssessorEvidenceRequest,
  isEvidenceDocumentType,
} from "@/lib/compliance/assessor-evidence-requests";
import { getOrgContextForUser } from "@/lib/org/context";
import { listOrgMembers } from "@/lib/org/data";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PATH = "/governance/compliance/evidence-requests";

export async function createEvidenceRequestAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role) redirect(`${PATH}?error=rbac`);

  const canCreate =
    isReadOnlyAuditorRole(orgContext.role) || canManageMembers(orgContext.role);
  if (!canCreate) redirect(`${PATH}?error=rbac`);

  const controlId = String(formData.get("controlId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const documentTypeRaw = String(formData.get("documentType") ?? "control_evidence").trim();
  const assignedRaw = String(formData.get("assignedToUserId") ?? "").trim();
  const dueRaw = String(formData.get("dueAt") ?? "").trim();

  if (!controlId || !title || !isEvidenceDocumentType(documentTypeRaw)) {
    redirect(`${PATH}?error=invalid`);
  }

  if (assignedRaw) {
    const members = await listOrgMembers(orgContext.orgId);
    if (!members.some((m) => m.userId === assignedRaw)) {
      redirect(`${PATH}?error=assignee`);
    }
  }

  const result = await createAssessorEvidenceRequest(user.id, orgContext.orgId, {
    controlId,
    title,
    description: description || undefined,
    documentType: documentTypeRaw,
    assignedToUserId: assignedRaw || null,
    dueAtIso: dueRaw ? new Date(dueRaw).toISOString() : undefined,
  }, supabase);

  if (!result.ok) redirect(`${PATH}?error=${encodeURIComponent(result.reason)}`);

  revalidatePath(PATH);
  redirect(`${PATH}?created=1`);
}

export async function fulfillEvidenceRequestAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role) redirect(`${PATH}?error=rbac`);
  if (isReadOnlyAuditorRole(orgContext.role)) redirect(`${PATH}?error=read_only`);

  const requestId = String(formData.get("requestId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!requestId) redirect(`${PATH}?error=invalid`);

  const ok = await fulfillAssessorEvidenceRequest(
    user.id,
    orgContext.orgId,
    { requestId, note: note || undefined },
    supabase,
  );

  if (!ok) redirect(`${PATH}?error=fulfill_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?fulfilled=1`);
}

export async function cancelEvidenceRequestAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role) redirect(`${PATH}?error=rbac`);

  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) redirect(`${PATH}?error=invalid`);

  const ok = await cancelAssessorEvidenceRequest(user.id, orgContext.orgId, requestId, supabase);
  if (!ok) redirect(`${PATH}?error=cancel_failed`);

  revalidatePath(PATH);
  redirect(`${PATH}?cancelled=1`);
}
