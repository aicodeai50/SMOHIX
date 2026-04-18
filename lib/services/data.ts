import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

import { formatIncidentRelative } from "@/lib/incidents/format";

export type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  environment: string | null;
  ownerHint: string | null;
  updated: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export async function listServicesForUser(userId: string): Promise<ServiceRow[]> {
  if (!hasSupabaseAuth()) {
    return [];
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, environment, owner_hint, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string | null) ?? null,
      environment: (r.environment as string | null) ?? null,
      ownerHint: (r.owner_hint as string | null) ?? null,
      updated: formatIncidentRelative(r.updated_at as string),
    }));
  } catch {
    return [];
  }
}

export async function createServiceForUser(
  userId: string,
  input: { name: string; description?: string; environment?: string; ownerHint?: string },
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  if (!hasSupabaseAuth()) {
    return { ok: false, reason: "Supabase is not configured." };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false, reason: "Name is required." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("services")
      .insert({
        user_id: userId,
        name: name.slice(0, 200),
        description: input.description?.trim().slice(0, 2000) || null,
        environment: input.environment?.trim().slice(0, 80) || null,
        owner_hint: input.ownerHint?.trim().slice(0, 200) || null,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, reason: error.message };
    }
    if (!data?.id) {
      return { ok: false, reason: "Insert returned no id." };
    }
    return { ok: true, id: data.id as string };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Could not create service.",
    };
  }
}

export async function deleteServiceForUser(
  userId: string,
  id: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!hasSupabaseAuth() || !isUuid(id)) {
    return { ok: false, reason: "Invalid request." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("services").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Delete failed.",
    };
  }
}
