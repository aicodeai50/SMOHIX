"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assignControlAttestation,
  attestControl,
} from "@/lib/compliance/attestation/data";
import { getOrgContextForUser } from "@/lib/org/context";
import { listOrgMembers } from "@/lib/org/data";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ATTESTATIONS_PATH = "/governance/compliance/attestations";

export async function assignControlAttestationAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(ATTESTATIONS_PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${ATTESTATIONS_PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect(`${ATTESTATIONS_PATH}?error=rbac`);
  }
  if (isReadOnlyAuditorRole(orgContext.role)) {
    redirect(`${ATTESTATIONS_PATH}?error=read_only`);
  }

  const attestationId = String(formData.get("attestationId") ?? "").trim();
  const ownerRaw = String(formData.get("ownerUserId") ?? "").trim();
  const ownerUserId = ownerRaw.length > 0 ? ownerRaw : null;
  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  const dueAtIso = dueRaw ? new Date(dueRaw).toISOString() : "";

  if (!attestationId || !dueAtIso) {
    redirect(`${ATTESTATIONS_PATH}?error=invalid`);
  }

  if (ownerUserId) {
    const members = await listOrgMembers(orgContext.orgId);
    if (!members.some((m) => m.userId === ownerUserId)) {
      redirect(`${ATTESTATIONS_PATH}?error=owner`);
    }
  }

  const result = await assignControlAttestation(
    user.id,
    orgContext.orgId,
    {
      attestationId,
      ownerUserId,
      dueAtIso,
    },
    supabase,
  );

  if (!result.ok) {
    redirect(`${ATTESTATIONS_PATH}?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath(ATTESTATIONS_PATH);
  revalidatePath("/governance/compliance");
  redirect(`${ATTESTATIONS_PATH}?assigned=1`);
}

export async function attestControlAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(ATTESTATIONS_PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${ATTESTATIONS_PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role) {
    redirect(`${ATTESTATIONS_PATH}?error=rbac`);
  }
  if (isReadOnlyAuditorRole(orgContext.role)) {
    redirect(`${ATTESTATIONS_PATH}?error=read_only`);
  }

  const attestationId = String(formData.get("attestationId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!attestationId) redirect(`${ATTESTATIONS_PATH}?error=invalid`);

  const { data: row } = await supabase
    .from("compliance_control_attestations")
    .select("owner_user_id")
    .eq("id", attestationId)
    .eq("org_id", orgContext.orgId)
    .maybeSingle();

  const isOwner = row?.owner_user_id === user.id;
  const canAdmin = canManageMembers(orgContext.role);
  if (!isOwner && !canAdmin) {
    redirect(`${ATTESTATIONS_PATH}?error=not_owner`);
  }

  const result = await attestControl(
    user.id,
    orgContext.orgId,
    {
      attestationId,
      note,
    },
    supabase,
  );

  if (!result.ok) {
    redirect(`${ATTESTATIONS_PATH}?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath(ATTESTATIONS_PATH);
  revalidatePath("/audit");
  redirect(`${ATTESTATIONS_PATH}?attested=1`);
}
