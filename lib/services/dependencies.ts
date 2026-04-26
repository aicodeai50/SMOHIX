import type { SupabaseClient } from "@supabase/supabase-js";

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
): Promise<ServiceDependencyGraph> {
  const [servicesRes, edgesRes] = await Promise.all([
    supabase.from("services").select("id, name").eq("user_id", userId).order("name", { ascending: true }),
    supabase
      .from("service_dependencies")
      .select("service_id, depends_on_service_id, relationship, criticality")
      .eq("user_id", userId),
  ]);

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
  const { error } = await supabase.from("service_dependencies").insert({
    user_id: input.userId,
    service_id: serviceId,
    depends_on_service_id: dependsOnServiceId,
    relationship,
    criticality,
  });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function deleteServiceDependencyForUser(
  supabase: SupabaseClient,
  input: {
    userId: string;
    serviceId: string;
    dependsOnServiceId: string;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!isUuid(input.serviceId) || !isUuid(input.dependsOnServiceId)) {
    return { ok: false, reason: "Invalid dependency edge." };
  }
  const { error } = await supabase
    .from("service_dependencies")
    .delete()
    .eq("user_id", input.userId)
    .eq("service_id", input.serviceId)
    .eq("depends_on_service_id", input.dependsOnServiceId);
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}
