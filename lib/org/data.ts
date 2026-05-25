import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { isOrgRole, type OrgRole } from "@/lib/org/roles";

export type OrgMembershipRow = {
  orgId: string;
  orgName: string;
  role: OrgRole;
};

export type OrgMemberRow = {
  userId: string;
  role: OrgRole;
  email: string | null;
  displayName: string | null;
};

export async function listOrgMembershipsForUser(userId: string): Promise<OrgMembershipRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("organization_members")
      .select("org_id, role, organizations(name)")
      .eq("user_id", userId);

    if (error || !data) return [];

    return data
      .map((row) => {
        const org = row.organizations as { name?: string } | null;
        const roleRaw = String(row.role ?? "");
        if (!isOrgRole(roleRaw)) return null;
        return {
          orgId: row.org_id as string,
          orgName: org?.name ?? "Organization",
          role: roleRaw,
        };
      })
      .filter((row): row is OrgMembershipRow => row !== null);
  } catch {
    return [];
  }
}

export async function listOrgMembers(
  orgId: string,
  opts?: { supabase?: SupabaseClient },
): Promise<OrgMemberRow[]> {
  try {
    const supabase = opts?.supabase ?? (await createServerSupabaseClient());
    const { data, error } = await supabase
      .from("organization_members")
      .select("user_id, role")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    const admin = createServiceSupabaseClient();
    const enriched: OrgMemberRow[] = [];

    for (const row of data) {
      const userId = row.user_id as string;
      const roleRaw = String(row.role ?? "");
      if (!isOrgRole(roleRaw)) continue;

      let email: string | null = null;
      let displayName: string | null = null;

      if (admin) {
        const { data: profile } = await admin
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .maybeSingle();
        displayName = (profile?.display_name as string | null) ?? null;

        const { data: authData } = await admin.auth.admin.getUserById(userId);
        email = authData.user?.email ?? null;
      }

      enriched.push({ userId, role: roleRaw, email, displayName });
    }

    return enriched;
  } catch {
    return [];
  }
}

export async function addOrgMemberByEmail(
  orgId: string,
  email: string,
  role: OrgRole,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { ok: false, reason: "Email is required." };
  if (!isOrgRole(role) || role === "owner") {
    return { ok: false, reason: "Invalid role for new member." };
  }

  const admin = createServiceSupabaseClient();
  if (!admin) {
    return { ok: false, reason: "Member invites require service role configuration." };
  }

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) {
    return { ok: false, reason: listError.message };
  }

  const match = listed.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
  if (!match?.id) {
    return {
      ok: false,
      reason: "No Zentro account found for that email. Ask them to sign up first.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("organization_members").insert({
    org_id: orgId,
    user_id: match.id,
    role,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, reason: "That user is already a member." };
    }
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}

export async function updateOrgMemberRole(
  orgId: string,
  memberUserId: string,
  role: OrgRole,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isOrgRole(role) || role === "owner") {
    return { ok: false, reason: "Invalid role." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("org_id", orgId)
      .eq("user_id", memberUserId)
      .neq("role", "owner");

    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch {
    return { ok: false, reason: "Could not update role." };
  }
}

export async function removeOrgMember(
  orgId: string,
  memberUserId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("org_id", orgId)
      .eq("user_id", memberUserId)
      .neq("role", "owner");

    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch {
    return { ok: false, reason: "Could not remove member." };
  }
}
