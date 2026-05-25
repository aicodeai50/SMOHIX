import type { SupabaseClient } from "@supabase/supabase-js";

import { applyUserOrOrgScope } from "@/lib/org/apply-scope-query";

type ServiceSloRow = {
  id: string;
  serviceId: string;
  sloName: string;
  targetPercent: number;
  windowDays: number;
  enabled: boolean;
};

export type ServiceSloSummary = {
  serviceId: string;
  serviceName: string;
  slo: ServiceSloRow | null;
  windows: {
    label: "7d" | "30d";
    incidentsCount: number;
    budgetUsedPercent: number;
    burnRate: number;
    state: "healthy" | "warning" | "critical";
  }[];
};

export type ErrorBudgetOverviewSummary = {
  servicesWithSlo: number;
  criticalBurnServices: number;
  warningBurnServices: number;
  averageBudgetUsedPercent: number | null;
};

export type ServiceBurnState = "healthy" | "warning" | "critical";
export type ServiceSloConfigRow = {
  id: string;
  serviceId: string;
  sloName: string;
  targetPercent: number;
  windowDays: 7 | 30 | 90;
  enabled: boolean;
};

function clampPercent(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v * 100) / 100));
}

function burnStateFromUsed(used: number): "healthy" | "warning" | "critical" {
  if (used >= 90) return "critical";
  if (used >= 70) return "warning";
  return "healthy";
}

function sloUpsertConflict(orgId?: string | null): string {
  return orgId ? "org_id,service_id,slo_name" : "user_id,service_id,slo_name";
}

export async function upsertDefaultSloForService(
  supabase: SupabaseClient,
  userId: string,
  serviceId: string,
  orgId?: string | null,
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    service_id: serviceId,
    slo_name: "Availability",
    target_percent: 99.9,
    window_days: 30,
    enabled: true,
  };
  if (orgId) row.org_id = orgId;

  await supabase.from("service_slos").upsert(row, { onConflict: sloUpsertConflict(orgId) });
}

export async function upsertServiceSloForUser(
  supabase: SupabaseClient,
  input: {
    userId: string;
    serviceId: string;
    targetPercent: number;
    windowDays: 7 | 30 | 90;
    enabled: boolean;
    orgId?: string | null;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!input.serviceId) return { ok: false, reason: "Service id is required." };
  if (!Number.isFinite(input.targetPercent) || input.targetPercent <= 0 || input.targetPercent >= 100) {
    return { ok: false, reason: "SLO target must be between 0 and 100." };
  }
  if (input.windowDays !== 7 && input.windowDays !== 30 && input.windowDays !== 90) {
    return { ok: false, reason: "SLO window must be one of 7d, 30d, or 90d." };
  }
  const row: Record<string, unknown> = {
    user_id: input.userId,
    service_id: input.serviceId,
    slo_name: "Availability",
    target_percent: clampPercent(input.targetPercent),
    window_days: input.windowDays,
    enabled: input.enabled,
  };
  if (input.orgId) row.org_id = input.orgId;

  const { error } = await supabase
    .from("service_slos")
    .upsert(row, { onConflict: sloUpsertConflict(input.orgId) });
  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function listServiceSloConfigsForUser(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null,
): Promise<ServiceSloConfigRow[]> {
  let query = supabase
    .from("service_slos")
    .select("id, service_id, slo_name, target_percent, window_days, enabled, updated_at")
    .order("updated_at", { ascending: false });
  query = applyUserOrOrgScope(query, userId, orgId);

  const { data, error } = await query;
  if (error || !data) return [];
  const firstByService = new Map<string, (typeof data)[number]>();
  for (const row of data) {
    const key = String(row.service_id);
    if (!firstByService.has(key)) firstByService.set(key, row);
  }
  return [...firstByService.values()].map((row) => ({
    id: String(row.id),
    serviceId: String(row.service_id),
    sloName: String(row.slo_name ?? "Availability"),
    targetPercent: Number(row.target_percent ?? 99.9),
    windowDays: Number(row.window_days ?? 30) as 7 | 30 | 90,
    enabled: Boolean(row.enabled),
  }));
}

export async function refreshErrorBudgetWindowsForUser(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null,
): Promise<void> {
  let servicesQuery = supabase.from("services").select("id");
  servicesQuery = applyUserOrOrgScope(servicesQuery, userId, orgId);

  let slosQuery = supabase
    .from("service_slos")
    .select("id, service_id, target_percent, enabled")
    .eq("enabled", true);
  slosQuery = applyUserOrOrgScope(slosQuery, userId, orgId);

  let incidentsQuery = supabase
    .from("incidents")
    .select("service_id, severity, created_at")
    .not("service_id", "is", null)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  incidentsQuery = applyUserOrOrgScope(incidentsQuery, userId, orgId);

  const [servicesRes, slosRes, incidentsRes] = await Promise.all([
    servicesQuery,
    slosQuery,
    incidentsQuery,
  ]);

  const serviceIds = (servicesRes.data ?? []).map((r) => String(r.id));
  if (!serviceIds.length) return;

  const sloByService = new Map(
    (slosRes.data ?? []).map((row) => [
      String(row.service_id),
      {
        id: String(row.id),
        targetPercent: Number(row.target_percent ?? 99.9),
      },
    ]),
  );
  const incidents = (incidentsRes.data ?? []).map((row) => ({
    serviceId: String(row.service_id),
    severity: String(row.severity ?? "low").toLowerCase(),
    createdAtMs: new Date(String(row.created_at)).valueOf(),
  }));
  const now = Date.now();

  const inserts: Record<string, unknown>[] = [];
  for (const serviceId of serviceIds) {
    const slo = sloByService.get(serviceId);
    if (!slo) continue;

    for (const [label, days] of [
      ["7d", 7],
      ["30d", 30],
    ] as const) {
      const windowStartMs = now - days * 24 * 60 * 60 * 1000;
      const scoped = incidents.filter(
        (i) => i.serviceId === serviceId && i.createdAtMs >= windowStartMs,
      );
      const weightedIncidents = scoped.reduce((acc, i) => {
        if (i.severity === "critical") return acc + 3;
        if (i.severity === "high") return acc + 2;
        if (i.severity === "medium") return acc + 1;
        return acc + 0.5;
      }, 0);

      const errorBudgetPercent = clampPercent(100 - slo.targetPercent);
      const budgetUsedPercent =
        errorBudgetPercent <= 0
          ? 100
          : clampPercent((weightedIncidents * (days === 7 ? 6 : 2.2)) / errorBudgetPercent);
      const burnRate = clampPercent(budgetUsedPercent / 100);
      const row: Record<string, unknown> = {
        user_id: userId,
        service_id: serviceId,
        slo_id: slo.id,
        window_label: label,
        incidents_count: scoped.length,
        budget_used_percent: budgetUsedPercent,
        burn_rate: burnRate,
        state: burnStateFromUsed(budgetUsedPercent),
      };
      if (orgId) row.org_id = orgId;
      inserts.push(row);
    }
  }

  if (inserts.length > 0) {
    await supabase.from("error_budget_windows").insert(inserts);
  }
}

export async function getServiceSloSummary(
  supabase: SupabaseClient,
  userId: string,
  serviceId: string,
  orgId?: string | null,
): Promise<ServiceSloSummary | null> {
  await upsertDefaultSloForService(supabase, userId, serviceId, orgId);
  await refreshErrorBudgetWindowsForUser(supabase, userId, orgId);

  let serviceQuery = supabase.from("services").select("id, name").eq("id", serviceId);
  serviceQuery = applyUserOrOrgScope(serviceQuery, userId, orgId);

  let sloQuery = supabase
    .from("service_slos")
    .select("id, service_id, slo_name, target_percent, window_days, enabled")
    .eq("service_id", serviceId)
    .eq("enabled", true)
    .order("updated_at", { ascending: false })
    .limit(1);
  sloQuery = applyUserOrOrgScope(sloQuery, userId, orgId);

  let windowsQuery = supabase
    .from("error_budget_windows")
    .select("window_label, incidents_count, budget_used_percent, burn_rate, state, recorded_at")
    .eq("service_id", serviceId)
    .order("recorded_at", { ascending: false })
    .limit(30);
  windowsQuery = applyUserOrOrgScope(windowsQuery, userId, orgId);

  const [serviceRes, sloRes, windowsRes] = await Promise.all([
    serviceQuery.maybeSingle(),
    sloQuery.maybeSingle(),
    windowsQuery,
  ]);
  if (!serviceRes.data) return null;

  type BudgetWindowDbRow = {
    window_label: unknown;
    incidents_count: unknown;
    budget_used_percent: unknown;
    burn_rate: unknown;
    state: unknown;
  };

  const latestByLabel = new Map<"7d" | "30d", BudgetWindowDbRow>();
  for (const row of (windowsRes.data ?? []) as BudgetWindowDbRow[]) {
    const label = String(row.window_label) === "7d" ? "7d" : "30d";
    if (!latestByLabel.has(label)) latestByLabel.set(label, row);
  }

  const windows: ServiceSloSummary["windows"] = (["7d", "30d"] as const).map((label) => {
    const row = latestByLabel.get(label);
    return {
      label,
      incidentsCount: Number(row?.incidents_count ?? 0),
      budgetUsedPercent: Number(row?.budget_used_percent ?? 0),
      burnRate: Number(row?.burn_rate ?? 0),
      state: (String(row?.state ?? "healthy") as "healthy" | "warning" | "critical"),
    };
  });

  return {
    serviceId,
    serviceName: String(serviceRes.data.name ?? "Service"),
    slo: sloRes.data
      ? {
          id: String(sloRes.data.id),
          serviceId: String(sloRes.data.service_id),
          sloName: String(sloRes.data.slo_name),
          targetPercent: Number(sloRes.data.target_percent),
          windowDays: Number(sloRes.data.window_days),
          enabled: Boolean(sloRes.data.enabled),
        }
      : null,
    windows,
  };
}

export async function getErrorBudgetOverviewSummary(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null,
): Promise<ErrorBudgetOverviewSummary> {
  await refreshErrorBudgetWindowsForUser(supabase, userId, orgId);

  let query = supabase
    .from("error_budget_windows")
    .select("service_id, window_label, budget_used_percent, state, recorded_at")
    .eq("window_label", "7d")
    .order("recorded_at", { ascending: false })
    .limit(200);
  query = applyUserOrOrgScope(query, userId, orgId);

  const { data } = await query;

  type BudgetOverviewDbRow = {
    service_id: unknown;
    budget_used_percent: unknown;
    state: unknown;
  };
  const latestByService = new Map<string, BudgetOverviewDbRow>();
  for (const row of (data ?? []) as BudgetOverviewDbRow[]) {
    const key = String(row.service_id);
    if (!latestByService.has(key)) latestByService.set(key, row);
  }
  const rows = [...latestByService.values()];
  const critical = rows.filter((r) => String(r.state) === "critical").length;
  const warning = rows.filter((r) => String(r.state) === "warning").length;
  const avg =
    rows.length > 0
      ? Math.round(
          (rows.reduce((acc, row) => acc + Number(row.budget_used_percent ?? 0), 0) / rows.length) *
            10,
        ) / 10
      : null;

  return {
    servicesWithSlo: rows.length,
    criticalBurnServices: critical,
    warningBurnServices: warning,
    averageBudgetUsedPercent: avg,
  };
}

export async function getLatestBurnStateForService(
  supabase: SupabaseClient,
  userId: string,
  serviceId: string,
  orgId?: string | null,
): Promise<ServiceBurnState> {
  await refreshErrorBudgetWindowsForUser(supabase, userId, orgId);

  let query = supabase
    .from("error_budget_windows")
    .select("state")
    .eq("service_id", serviceId)
    .eq("window_label", "7d")
    .order("recorded_at", { ascending: false })
    .limit(1);
  query = applyUserOrOrgScope(query, userId, orgId);

  const { data } = await query.maybeSingle();
  const state = String(data?.state ?? "healthy");
  if (state === "critical" || state === "warning") return state;
  return "healthy";
}

export async function listLatestBurnStatesForUser(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null,
): Promise<Map<string, ServiceBurnState>> {
  await refreshErrorBudgetWindowsForUser(supabase, userId, orgId);

  let query = supabase
    .from("error_budget_windows")
    .select("service_id, state, recorded_at")
    .eq("window_label", "7d")
    .order("recorded_at", { ascending: false })
    .limit(500);
  query = applyUserOrOrgScope(query, userId, orgId);

  const { data } = await query;
  const byService = new Map<string, ServiceBurnState>();
  for (const row of data ?? []) {
    const serviceId = String(row.service_id);
    if (byService.has(serviceId)) continue;
    const state = String(row.state);
    byService.set(serviceId, state === "critical" || state === "warning" ? state : "healthy");
  }
  return byService;
}
