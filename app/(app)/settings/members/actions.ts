"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  createOrganizationRpc,
  getOrgContextForUser,
  setActiveOrgCookie,
  verifyOrgMembership,
} from "@/lib/org/context";
import {
  addOrgMemberByEmail,
  removeOrgMember,
  updateOrgMemberRole,
} from "@/lib/org/data";
import { canManageMembers, isOrgRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireUser() {
  if (!hasSupabaseAuth()) {
    redirect("/settings/members?error=Supabase+auth+required");
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/settings/members");
  }
  return user;
}

export async function createOrganizationAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "");
  const result = await createOrganizationRpc(name);
  if (!result.ok) {
    redirect(`/settings/members?error=${encodeURIComponent(result.reason)}`);
  }
  await setActiveOrgCookie(result.orgId);
  await appendAuditEvent({
    event_type: "org.created",
    user_id: user.id,
    org_id: result.orgId,
    details: { org_id: result.orgId, name: name.trim().slice(0, 200) },
  });
  revalidatePath("/settings/members");
  revalidatePath("/approvals");
  redirect("/settings/members?created=1");
}

export async function setActiveOrganizationAction(formData: FormData) {
  const user = await requireUser();
  const orgId = String(formData.get("org_id") ?? "").trim();
  if (!orgId) return;
  const membership = await verifyOrgMembership(user.id, orgId);
  if (!membership) {
    redirect("/settings/members?error=not_a_member");
  }
  await setActiveOrgCookie(orgId);
  revalidatePath("/settings/members");
  revalidatePath("/approvals");
  revalidatePath("/governance/policies");
  redirect("/settings/members");
}

export async function addOrganizationMemberAction(formData: FormData) {
  const user = await requireUser();
  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/settings/members?error=admin_required");
  }

  const email = String(formData.get("email") ?? "");
  const roleRaw = String(formData.get("role") ?? "operator").trim();
  if (!isOrgRole(roleRaw)) {
    redirect("/settings/members?error=invalid_role");
  }

  const result = await addOrgMemberByEmail(orgContext.orgId, email, roleRaw);
  if (!result.ok) {
    redirect(`/settings/members?error=${encodeURIComponent(result.reason)}`);
  }

  await appendAuditEvent({
    event_type: "org.member_added",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: { org_id: orgContext.orgId, email: email.trim().slice(0, 200), role: roleRaw },
  });

  revalidatePath("/settings/members");
  redirect("/settings/members?member_added=1");
}

export async function updateOrganizationMemberRoleAction(formData: FormData) {
  const user = await requireUser();
  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/settings/members?error=admin_required");
  }

  const memberUserId = String(formData.get("member_user_id") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim();
  if (!memberUserId || !isOrgRole(roleRaw)) {
    redirect("/settings/members?error=invalid_role");
  }

  const result = await updateOrgMemberRole(orgContext.orgId, memberUserId, roleRaw);
  if (!result.ok) {
    redirect(`/settings/members?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/settings/members");
  redirect("/settings/members");
}

export async function removeOrganizationMemberAction(formData: FormData) {
  const user = await requireUser();
  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    redirect("/settings/members?error=admin_required");
  }

  const memberUserId = String(formData.get("member_user_id") ?? "").trim();
  if (!memberUserId || memberUserId === user.id) {
    redirect("/settings/members?error=cannot_remove_self");
  }

  const result = await removeOrgMember(orgContext.orgId, memberUserId);
  if (!result.ok) {
    redirect(`/settings/members?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath("/settings/members");
  redirect("/settings/members");
}
