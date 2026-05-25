"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createThirdPartyVendor,
  updateThirdPartyVendor,
} from "@/lib/third-party-risk/data";
import {
  isVendorCategory,
  isVendorRiskTier,
  isVendorStatus,
} from "@/lib/third-party-risk/inheritance";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers, isReadOnlyAuditorRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const REGISTER_PATH = "/governance/third-party-risk";

export async function createThirdPartyVendorAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(REGISTER_PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${REGISTER_PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect(`${REGISTER_PATH}?error=rbac`);
  }
  if (isReadOnlyAuditorRole(orgContext.role)) {
    redirect(`${REGISTER_PATH}?error=read_only`);
  }

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const riskTier = String(formData.get("riskTier") ?? "");
  const status = String(formData.get("status") ?? "active");
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const reviewRaw = String(formData.get("reviewDueAt") ?? "").trim();
  const reviewDueAtIso = reviewRaw ? new Date(reviewRaw).toISOString() : null;

  if (!isVendorCategory(category) || !isVendorRiskTier(riskTier)) {
    redirect(`${REGISTER_PATH}?error=invalid`);
  }

  const result = await createThirdPartyVendor(
    user.id,
    orgContext.orgId,
    {
      name,
      category,
      riskTier,
      status: isVendorStatus(status) ? status : "active",
      reviewDueAtIso,
      contactEmail,
      notes,
    },
    supabase,
  );

  if (!result.ok) {
    redirect(`${REGISTER_PATH}?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath(REGISTER_PATH);
  revalidatePath("/governance/compliance");
  redirect(`${REGISTER_PATH}?created=${encodeURIComponent(result.vendorId)}`);
}

export async function updateThirdPartyVendorAction(formData: FormData) {
  if (!hasSupabaseAuth()) redirect(REGISTER_PATH);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=${REGISTER_PATH}`);

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect(`${REGISTER_PATH}?error=rbac`);
  }
  if (isReadOnlyAuditorRole(orgContext.role)) {
    redirect(`${REGISTER_PATH}?error=read_only`);
  }

  const vendorId = String(formData.get("vendorId") ?? "").trim();
  const riskTier = String(formData.get("riskTier") ?? "");
  const category = String(formData.get("category") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!vendorId || !isVendorRiskTier(riskTier) || !isVendorCategory(category) || !isVendorStatus(status)) {
    redirect(`${REGISTER_PATH}?error=invalid`);
  }

  const result = await updateThirdPartyVendor(
    user.id,
    orgContext.orgId,
    vendorId,
    { riskTier, category, status },
    supabase,
  );

  if (!result.ok) {
    redirect(`${REGISTER_PATH}?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath(REGISTER_PATH);
  redirect(`${REGISTER_PATH}?updated=1`);
}
