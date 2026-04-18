import { randomUUID } from "node:crypto";

import { displayKeyPrefix, generateApiKeyPlaintext, hashApiKeyPlaintext } from "@/lib/api-keys/token";

export type DevApiKeyRecord = {
  id: string;
  tenantId: string;
  name: string;
  key_prefix: string;
  secret_hash: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

const byTenant = new Map<string, DevApiKeyRecord[]>();

function bucket(tenantId: string): DevApiKeyRecord[] {
  let b = byTenant.get(tenantId);
  if (!b) {
    b = [];
    byTenant.set(tenantId, b);
  }
  return b;
}

export type DevApiKeyListRow = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export function devListKeys(tenantId: string): DevApiKeyListRow[] {
  return bucket(tenantId).map(
    ({ id, name, key_prefix, created_at, last_used_at, revoked_at }) => ({
      id,
      name,
      key_prefix,
      created_at,
      last_used_at,
      revoked_at,
    }),
  );
}

export function devCreateKey(
  tenantId: string,
  name: string,
): { row: DevApiKeyListRow; plain: string } {
  const plain = generateApiKeyPlaintext();
  const rec: DevApiKeyRecord = {
    id: randomUUID(),
    tenantId,
    name,
    key_prefix: displayKeyPrefix(plain),
    secret_hash: hashApiKeyPlaintext(plain),
    created_at: new Date().toISOString(),
    last_used_at: null,
    revoked_at: null,
  };
  bucket(tenantId).unshift(rec);
  const { id, key_prefix, created_at, last_used_at, revoked_at } = rec;
  return {
    plain,
    row: { id, name, key_prefix, created_at, last_used_at, revoked_at },
  };
}

export function devRevokeKey(tenantId: string, id: string): boolean {
  const k = bucket(tenantId).find((r) => r.id === id && !r.revoked_at);
  if (!k) {
    return false;
  }
  k.revoked_at = new Date().toISOString();
  return true;
}

/** Resolve session API key to tenant for proxy rate limits when Supabase auth is off. */
export function devResolveTenantFromPlainKey(plain: string): {
  tenantId: string;
} | null {
  const h = hashApiKeyPlaintext(plain);
  for (const list of byTenant.values()) {
    const hit = list.find((r) => r.secret_hash === h && !r.revoked_at);
    if (hit) {
      hit.last_used_at = new Date().toISOString();
      return { tenantId: hit.tenantId };
    }
  }
  return null;
}
