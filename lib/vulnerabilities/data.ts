import { createServerSupabaseClient } from "@/lib/supabase/server";

export type VulnerabilityFindingRow = {
  id: string;
  scanner: string;
  externalId: string;
  title: string;
  severity: string;
  cvssScore: number | null;
  assetHost: string | null;
  cveId: string | null;
  status: string;
  incidentId: string | null;
  penTestEngagementId: string | null;
  penTestEngagementName: string | null;
  detectedAt: string;
};

export async function listVulnerabilityFindingsForUser(
  userId: string,
  limit = 100,
): Promise<VulnerabilityFindingRow[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("vulnerability_findings")
      .select(
        "id, scanner, external_id, title, severity, cvss_score, asset_host, cve_id, status, incident_id, pen_test_engagement_id, detected_at, pen_test_engagements(name)",
      )
      .eq("user_id", userId)
      .order("detected_at", { ascending: false })
      .limit(limit);

    if (error) return [];

    return (data ?? []).map((row) => {
      const engagement = row.pen_test_engagements as { name?: string } | null;
      return {
        id: row.id as string,
        scanner: row.scanner as string,
        externalId: row.external_id as string,
        title: row.title as string,
        severity: row.severity as string,
        cvssScore: row.cvss_score != null ? Number(row.cvss_score) : null,
        assetHost: (row.asset_host as string | null) ?? null,
        cveId: (row.cve_id as string | null) ?? null,
        status: row.status as string,
        incidentId: (row.incident_id as string | null) ?? null,
        penTestEngagementId: (row.pen_test_engagement_id as string | null) ?? null,
        penTestEngagementName: engagement?.name ?? null,
        detectedAt: row.detected_at as string,
      };
    });
  } catch {
    return [];
  }
}
