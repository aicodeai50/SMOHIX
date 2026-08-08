import {
  ASSESSOR_API_KEY_PREFIX,
  API_KEY_PREFIX,
  hashApiKeyPlaintext,
} from "@/lib/api-keys/token";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

function extractPrefixedKey(req: { headers: Headers }, prefix: string): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const t = auth.slice("Bearer ".length).trim();
    if (t.startsWith(prefix)) {
      return t;
    }
  }
  const h = req.headers.get("x-zentro-api-key")?.trim();
  if (h?.startsWith(prefix)) {
    return h;
  }
  return null;
}

export function extractSmohixApiKey(req: { headers: Headers }): string | null {
  return extractPrefixedKey(req, API_KEY_PREFIX);
}

export function extractAssessorApiKey(req: { headers: Headers }): string | null {
  return extractPrefixedKey(req, ASSESSOR_API_KEY_PREFIX);
}


/**
 * Resolve owning user for proxy auth. Requires service role to read by `secret_hash`
 * (RLS does not expose rows by secret from anonymous callers).
 */
export async function resolveUserIdFromApiKeyPlaintext(
  plain: string,
): Promise<string | null> {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return null;
  }
  const hash = hashApiKeyPlaintext(plain);
  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id")
    .eq("secret_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data?.user_id) {
    return null;
  }

  const ts = new Date().toISOString();
  void admin.from("api_keys").update({ last_used_at: ts }).eq("id", data.id).then(() => {});

  return data.user_id as string;
}
