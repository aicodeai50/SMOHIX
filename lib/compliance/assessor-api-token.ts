import type { SupabaseClient } from "@supabase/supabase-js";

import {
  displayAssessorKeyPrefix,
  generateAssessorApiKeyPlaintext,
  hashApiKeyPlaintext,
} from "@/lib/api-keys/token";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ComplianceAssessorApiTokenRow = {
  id: string;
  orgId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export type ResolvedAssessorApiAuth = {
  tokenId: string;
  orgId: string;
  actorUserId: string;
  tokenName: string;
};

function mapRow(r: Record<string, unknown>): ComplianceAssessorApiTokenRow {
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    name: String(r.name),
    keyPrefix: String(r.key_prefix),
    createdAt: String(r.created_at),
    lastUsedAt: (r.last_used_at as string | null) ?? null,
    revokedAt: (r.revoked_at as string | null) ?? null,
  };
}

export async function listComplianceAssessorApiTokens(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<ComplianceAssessorApiTokenRow[]> {
  if (!hasSupabaseAuth() || !orgId) return [];
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("compliance_assessor_api_tokens")
    .select("id, org_id, name, key_prefix, created_at, last_used_at, revoked_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

export async function createComplianceAssessorApiToken(
  userId: string,
  orgId: string,
  name: string,
  supabase?: SupabaseClient,
): Promise<{ row: ComplianceAssessorApiTokenRow; plainKey: string } | { error: string }> {
  if (!hasSupabaseAuth() || !userId || !orgId) {
    return { error: "Not configured." };
  }

  const plain = generateAssessorApiKeyPlaintext();
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_assessor_api_tokens")
    .insert({
      org_id: orgId,
      created_by: userId,
      name: name.trim().slice(0, 80) || "Assessor API token",
      key_prefix: displayAssessorKeyPrefix(plain),
      secret_hash: hashApiKeyPlaintext(plain),
    })
    .select("id, org_id, name, key_prefix, created_at, last_used_at, revoked_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create token." };
  }

  return { row: mapRow(data as Record<string, unknown>), plainKey: plain };
}

export async function revokeComplianceAssessorApiToken(
  orgId: string,
  tokenId: string,
  supabase?: SupabaseClient,
): Promise<boolean> {
  if (!hasSupabaseAuth() || !orgId || !tokenId) return false;
  const client = supabase ?? (await createServerSupabaseClient());
  const { error } = await client
    .from("compliance_assessor_api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .eq("org_id", orgId)
    .is("revoked_at", null);
  return !error;
}

async function resolveOrgActorUserId(
  admin: SupabaseClient,
  orgId: string,
  fallbackUserId: string,
): Promise<string> {
  const { data: owner } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (owner?.user_id) return owner.user_id as string;

  const { data: member } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", fallbackUserId)
    .maybeSingle();
  if (member?.user_id) return fallbackUserId;

  return fallbackUserId;
}

/** Resolve org-scoped assessor token via service role (hash lookup). */
export async function resolveComplianceAssessorApiKey(
  plain: string,
): Promise<ResolvedAssessorApiAuth | null> {
  const admin = createServiceSupabaseClient();
  if (!admin) return null;

  const hash = hashApiKeyPlaintext(plain);
  const { data, error } = await admin
    .from("compliance_assessor_api_tokens")
    .select("id, org_id, created_by, name")
    .eq("secret_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;

  const orgId = String(data.org_id);
  const actorUserId = await resolveOrgActorUserId(
    admin,
    orgId,
    String(data.created_by),
  );

  const ts = new Date().toISOString();
  void admin
    .from("compliance_assessor_api_tokens")
    .update({ last_used_at: ts })
    .eq("id", data.id)
    .then(() => {});

  return {
    tokenId: String(data.id),
    orgId,
    actorUserId,
    tokenName: String(data.name),
  };
}
