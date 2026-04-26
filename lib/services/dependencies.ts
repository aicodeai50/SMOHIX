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
