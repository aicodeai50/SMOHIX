import { createServiceSupabaseClient } from "@/lib/supabase/admin";

/** Primary org for webhook/ingest attribution (first membership by created_at). */
export async function resolvePrimaryOrgIdForUser(userId: string): Promise<string | null> {
  const admin = createServiceSupabaseClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("organization_members")
    .select("org_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.org_id) return null;
  return data.org_id as string;
}
