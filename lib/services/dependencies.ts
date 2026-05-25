import type { SupabaseClient } from "@supabase/supabase-js";

import { applyUserOrOrgScope } from "@/lib/org/apply-scope-query";

export type ServiceDependencyEdge = {
  fromServiceId: string;
  fromServiceName: string;
  toServiceId: string;
  toServiceName: string;
  relationship: "runtime" | "data" | "network" | "auth" | "other";
  criticality: "low" | "medium" | "high";
};

export type ServiceDependencyGraph = {
  nodes: { id: string; name: string }[];
  edges: ServiceDependencyEdge[];
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: string): boolean {
  return UUID_RE.test(v);
}

export async function listServiceDependencyGraphForUser(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null,
): Promise<ServiceDependencyGraph> {
  let servicesQuery = supabase.from("services").select("id, name").order("name", { ascending: true });
  servicesQuery = applyUserOrOrgScope(servicesQuery, userId, orgId);

  let edgesQuery = supabase
    .from("service_dependencies")
    .select("service_id, depends_on_service_id, relationship, criticality");
  edgesQuery = applyUserOrOrgScope(edgesQuery, userId, orgId);

  const [servicesRes, edgesRes] = await Promise.all([servicesQuery, edgesQuery]);

  const nodes = (servicesRes.data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Service"),
  }));
  const nameById = new Map(nodes.map((n) => [n.id, n.name]));
  const edges: ServiceDependencyEdge[] = (edgesRes.data ?? []).map((row) => ({
    fromServiceId: String(row.service_id),
    fromServiceName: nameById.get(String(row.service_id)) ?? "Unknown service",
    toServiceId: String(row.depends_on_service_id),
    toServiceName: nameById.get(String(row.depends_on_service_id)) ?? "Unknown dependency",
    relationship: String(row.relationship ?? "runtime") as ServiceDependencyEdge["relationship"],
    criticality: String(row.criticality ?? "medium") as ServiceDependencyEdge["criticality"],
  }));

  return { nodes, edges };
}

export async function createServiceDependencyForUser(
  supabase: SupabaseClient,
  input: {
    userId: string;
    serviceId: string;
    dependsOnServiceId: string;
    relationship?: ServiceDependencyEdge["relationship"];
    criticality?: ServiceDependencyEdge["criticality"];
    orgId?: string | null;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const serviceId = input.serviceId.trim();
  const dependsOnServiceId = input.dependsOnServiceId.trim();
  if (!isUuid(serviceId) || !isUuid(dependsOnServiceId)) {
    return { ok: false, reason: "Valid service ids are required." };
  }
  if (serviceId === dependsOnServiceId) {
    return { ok: false, reason: "A service cannot depend on itself." };
  }

  const relationship = input.relationship ?? "runtime";
  const criticality = input.criticality ?? "medium";
  const row: Record<string, unknown> = {
    user_id: input.userId,
    service_id: serviceId,
    depends_on_service_id: dependsOnServiceId,
    relationship,
    criticality,
  };
  if (input.orgId) row.org_id = input.orgId;

  const { error } = await supabase.from("service_dependencies").insert(row);
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function deleteServiceDependencyForUser(
  supabase: SupabaseClient,
  input: {
    userId: string;
    serviceId: string;
    dependsOnServiceId: string;
    orgId?: string | null;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isUuid(input.serviceId) || !isUuid(input.dependsOnServiceId)) {
    return { ok: false, reason: "Invalid dependency edge." };
  }
  let query = supabase
    .from("service_dependencies")
    .delete()
    .eq("service_id", input.serviceId)
    .eq("depends_on_service_id", input.dependsOnServiceId);
  query = applyUserOrOrgScope(query, input.userId, input.orgId);

  const { error } = await query;
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}
