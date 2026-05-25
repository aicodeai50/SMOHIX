import { cookies } from "next/headers";

import { ACTIVE_ORG_COOKIE } from "@/lib/org/cookies";
import {
  listOrgMembershipsForUser,
  type OrgMembershipRow,
} from "@/lib/org/data";
import type { OrgRole } from "@/lib/org/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type OrgContext = {
  orgId: string | null;
  orgName: string | null;
  role: OrgRole | null;
  memberships: OrgMembershipRow[];
};

export async function getOrgContextForUser(userId: string): Promise<OrgContext> {
  const memberships = await listOrgMembershipsForUser(userId);
  if (memberships.length === 0) {
    return { orgId: null, orgName: null, role: null, memberships: [] };
  }

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_ORG_COOKIE)?.value?.trim() ?? null;
  const active =
    (preferred ? memberships.find((m) => m.orgId === preferred) : null) ??
    memberships[0];

  return {
    orgId: active.orgId,
    orgName: active.orgName,
    role: active.role,
    memberships,
  };
}

export async function setActiveOrgCookie(orgId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function verifyOrgMembership(
  userId: string,
  orgId: string,
): Promise<OrgMembershipRow | null> {
  const memberships = await listOrgMembershipsForUser(userId);
  return memberships.find((m) => m.orgId === orgId) ?? null;
}

export async function createOrganizationRpc(name: string): Promise<
  | { ok: true; orgId: string }
  | { ok: false; reason: string }
> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "Organization name is required." };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("create_organization_for_user", {
      p_name: trimmed,
    });
    if (error || !data) {
      return { ok: false, reason: error?.message ?? "Could not create organization." };
    }
    return { ok: true, orgId: data as string };
  } catch {
    return { ok: false, reason: "Could not create organization." };
  }
}
