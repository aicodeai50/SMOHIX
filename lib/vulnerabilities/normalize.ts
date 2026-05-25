import type { IncidentSeverity } from "@/lib/incidents/types";

export type NormalizedVulnerabilityFinding = {
  scanner: "qualys" | "tenable" | "other";
  externalId: string;
  title: string;
  severity: IncidentSeverity;
  cvssScore: number | null;
  assetHost: string | null;
  cveId: string | null;
  summary: string | null;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function cvssToSeverity(score: number | null): IncidentSeverity {
  if (score == null || !Number.isFinite(score)) return "medium";
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function textSeverity(value: string | null): IncidentSeverity {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "critical" || v === "5" || v === "urgent") return "critical";
  if (v === "high" || v === "4" || v === "serious") return "high";
  if (v === "medium" || v === "3" || v === "moderate") return "medium";
  if (v === "low" || v === "1" || v === "2" || v === "info") return "low";
  return "medium";
}

function parseCvss(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizeQualysFinding(raw: unknown): NormalizedVulnerabilityFinding | null {
  const obj = asObject(raw);
  if (!obj) return null;

  const host = asObject(obj.HOST) ?? asObject(obj.host) ?? obj;
  const externalId =
    (typeof obj.QID === "string" && obj.QID.trim()) ||
    (typeof obj.qid === "string" && obj.qid.trim()) ||
    (typeof obj.ID === "string" && obj.ID.trim()) ||
    (typeof obj.finding_id === "string" && obj.finding_id.trim()) ||
    null;

  const title =
    (typeof obj.TITLE === "string" && obj.TITLE.trim()) ||
    (typeof obj.title === "string" && obj.title.trim()) ||
    (typeof obj.VULN_TYPE === "string" && obj.VULN_TYPE.trim()) ||
    "Qualys finding";

  const cvss = parseCvss(obj.CVSS_BASE ?? obj.cvss_base ?? obj.cvss_score ?? obj.cvss);
  const severityRaw =
    (typeof obj.SEVERITY === "string" ? obj.SEVERITY : null) ||
    (typeof obj.severity === "string" ? obj.severity : null);

  const assetHost =
    (typeof host.IP === "string" && host.IP.trim()) ||
    (typeof host.DNS === "string" && host.DNS.trim()) ||
    (typeof host.ip === "string" && host.ip.trim()) ||
    (typeof obj.asset === "string" && obj.asset.trim()) ||
    null;

  const cveId =
    (typeof obj.CVE_ID === "string" && obj.CVE_ID.trim()) ||
    (typeof obj.cve_id === "string" && obj.cve_id.trim()) ||
    (typeof obj.cve === "string" && obj.cve.trim()) ||
    null;

  if (!externalId) return null;

  const severity = cvss != null ? cvssToSeverity(cvss) : textSeverity(severityRaw);

  return {
    scanner: "qualys",
    externalId: externalId.slice(0, 200),
    title: title.slice(0, 500),
    severity,
    cvssScore: cvss,
    assetHost: assetHost ? assetHost.slice(0, 200) : null,
    cveId: cveId ? cveId.slice(0, 40) : null,
    summary:
      typeof obj.DIAGNOSIS === "string"
        ? obj.DIAGNOSIS.trim().slice(0, 12000)
        : typeof obj.diagnosis === "string"
          ? obj.diagnosis.trim().slice(0, 12000)
          : null,
  };
}

export function normalizeTenableFinding(raw: unknown): NormalizedVulnerabilityFinding | null {
  const obj = asObject(raw);
  if (!obj) return null;

  const plugin = asObject(obj.plugin) ?? asObject(obj.Plugin) ?? {};
  const asset = asObject(obj.asset) ?? asObject(obj.Asset) ?? {};

  const externalId =
    (typeof obj.id === "string" && obj.id.trim()) ||
    (typeof obj.finding_id === "string" && obj.finding_id.trim()) ||
    (typeof obj.plugin_id === "string" && obj.plugin_id.trim()) ||
    (typeof plugin.id === "string" && plugin.id.trim()) ||
    (typeof plugin.id === "number" ? String(plugin.id) : null);

  const title =
    (typeof plugin.name === "string" && plugin.name.trim()) ||
    (typeof obj.plugin_name === "string" && obj.plugin_name.trim()) ||
    (typeof obj.title === "string" && obj.title.trim()) ||
    "Tenable finding";

  const cvss = parseCvss(
    plugin.cvss_base_score ?? obj.cvss_base_score ?? obj.cvss_score ?? obj.cvss,
  );
  const severityRaw =
    (typeof plugin.severity === "string" ? plugin.severity : null) ||
    (typeof obj.severity === "string" ? obj.severity : null) ||
    (typeof obj.risk_level === "string" ? obj.risk_level : null);

  const assetHost =
    (typeof asset.hostname === "string" && asset.hostname.trim()) ||
    (typeof asset.fqdn === "string" && asset.fqdn.trim()) ||
    (typeof asset.ipv4 === "string" && asset.ipv4.trim()) ||
    (typeof obj.hostname === "string" && obj.hostname.trim()) ||
    null;

  const cveRaw = plugin.cve ?? obj.cve ?? obj.cve_id;
  const cveId = Array.isArray(cveRaw)
    ? String(cveRaw[0] ?? "").trim() || null
    : typeof cveRaw === "string"
      ? cveRaw.trim() || null
      : null;

  if (!externalId) return null;

  const severity = cvss != null ? cvssToSeverity(cvss) : textSeverity(severityRaw);

  return {
    scanner: "tenable",
    externalId: externalId.slice(0, 200),
    title: title.slice(0, 500),
    severity,
    cvssScore: cvss,
    assetHost: assetHost ? assetHost.slice(0, 200) : null,
    cveId: cveId ? cveId.slice(0, 40) : null,
    summary:
      typeof plugin.description === "string"
        ? plugin.description.trim().slice(0, 12000)
        : typeof obj.description === "string"
          ? obj.description.trim().slice(0, 12000)
          : null,
  };
}

export function normalizeVulnerabilityPayload(
  raw: unknown,
  sourceHint?: string | null,
): NormalizedVulnerabilityFinding | null {
  const obj = asObject(raw);
  if (!obj) return null;

  const source = (sourceHint ?? "").toLowerCase();
  const vendor =
    typeof obj.vendor === "string" ? obj.vendor.trim().toLowerCase() : null;
  const scannerField =
    typeof obj.scanner === "string" ? obj.scanner.trim().toLowerCase() : null;

  if (
    vendor === "qualys" ||
    scannerField === "qualys" ||
    source.includes("qualys") ||
    obj.QID != null ||
    obj.HOST != null
  ) {
    return normalizeQualysFinding(obj);
  }

  if (
    vendor === "tenable" ||
    vendor === "nessus" ||
    scannerField === "tenable" ||
    source.includes("tenable") ||
    source.includes("nessus") ||
    obj.plugin != null ||
    obj.plugin_id != null
  ) {
    return normalizeTenableFinding(obj);
  }

  const genericId =
    (typeof obj.finding_id === "string" && obj.finding_id.trim()) ||
    (typeof obj.id === "string" && obj.id.trim()) ||
    null;
  const genericTitle =
    (typeof obj.title === "string" && obj.title.trim()) || "Vulnerability finding";
  if (!genericId) return null;

  const cvss = parseCvss(obj.cvss_score ?? obj.cvss);
  return {
    scanner: "other",
    externalId: genericId.slice(0, 200),
    title: genericTitle.slice(0, 500),
    severity: cvss != null ? cvssToSeverity(cvss) : textSeverity(String(obj.severity ?? "")),
    cvssScore: cvss,
    assetHost:
      typeof obj.asset === "string"
        ? obj.asset.trim().slice(0, 200)
        : typeof obj.hostname === "string"
          ? obj.hostname.trim().slice(0, 200)
          : null,
    cveId: typeof obj.cve === "string" ? obj.cve.trim().slice(0, 40) : null,
    summary: typeof obj.summary === "string" ? obj.summary.trim().slice(0, 12000) : null,
  };
}
