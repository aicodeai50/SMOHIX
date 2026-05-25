import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { appBody, appMeta, appOverline } from "@/lib/app-typography";
import { getOrgContextForUser } from "@/lib/org/context";
import { listVulnerabilityFindingsForUser } from "@/lib/vulnerabilities/data";
import { prioritizeVulnerabilityFindings } from "@/lib/vulnerabilities/prioritize";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Vulnerabilities",
  description: "Prioritized scanner findings from Qualys, Tenable, and webhook ingest.",
};

export const dynamic = "force-dynamic";

const SEV_STYLE: Record<string, string> = {
  critical: "text-danger",
  high: "text-warning",
  medium: "text-accent",
  low: "text-muted",
};

const PRIORITY_STYLE: Record<string, string> = {
  critical: "border-danger/40 bg-danger-dim/30 text-danger",
  high: "border-warning/40 bg-warning-dim/20 text-warning",
  medium: "border-accent/30 bg-accent/10 text-accent",
  low: "border-border bg-surface/40 text-muted",
};

export default async function VulnerabilitiesPage() {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Vulnerabilities"
          description="Connect Supabase and sign in to view scanner findings ingested via webhook."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>
          Local mode does not persist vulnerability findings.
        </p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/assets/vulnerabilities");
  }

  const orgContext = await getOrgContextForUser(user.id);
  const rawRows = await listVulnerabilityFindingsForUser(user.id);
  const rows = await prioritizeVulnerabilityFindings(user.id, rawRows, orgContext.orgId);

  const openCount = rows.filter((r) => r.status === "open").length;
  const urgentCount = rows.filter(
    (r) => r.exposurePriority === "critical" || r.exposurePriority === "high",
  ).length;
  const prodExposure = rows.filter((r) => r.assetCriticality === "critical").length;

  return (
    <>
      <PageHeader
        eyebrow="Assets"
        title="Vulnerabilities"
        description="Exposure queue ranked by CVSS plus asset criticality from your service catalog (production hosts surface first)."
      />
      <p className={`-mt-4 mb-6 ${appBody}`}>
        <Link href="/settings/api-keys" className="text-accent hover:underline">
          API keys
        </Link>
        {" · "}
        <Link href="/services" className="text-accent hover:underline">
          Service catalog
        </Link>
        {" · "}
        <Link href="/assets/attack-paths" className="text-accent hover:underline">
          Attack paths
        </Link>
        {" · "}
        <Link href="/changes/pentest" className="text-accent hover:underline">
          Pen-test
        </Link>
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Findings</p>
          <p className={`mt-1 text-2xl font-semibold text-foreground ${appBody}`}>{rows.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Open</p>
          <p className={`mt-1 text-2xl font-semibold text-accent ${appBody}`}>{openCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Urgent (high+)</p>
          <p className={`mt-1 text-2xl font-semibold text-warning ${appBody}`}>{urgentCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <p className={appOverline}>Production assets</p>
          <p className={`mt-1 text-2xl font-semibold text-danger ${appBody}`}>{prodExposure}</p>
        </div>
      </div>

      <PlaceholderCard title="Prioritized exposure queue">
        {rows.length === 0 ? (
          <ConsoleEmptyState
            title="No findings yet"
            description="Create an ingest token under Settings → API keys, then POST Qualys or Tenable JSON to /api/integrations/vulnerabilities."
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li key={row.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className={`font-medium text-foreground ${appBody}`}>{row.title}</p>
                    <p className={`mt-1 text-muted ${appMeta}`}>
                      {row.scanner} · {row.externalId}
                      {row.assetHost ? ` · ${row.assetHost}` : ""}
                      {row.cveId ? ` · ${row.cveId}` : ""}
                      {row.cvssScore != null ? ` · CVSS ${row.cvssScore}` : ""}
                      {row.matchedServiceName ? ` · svc ${row.matchedServiceName}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[row.exposurePriority] ?? PRIORITY_STYLE.medium}`}
                    >
                      {row.exposureScore} · {row.exposurePriority}
                    </span>
                    <span className={`text-xs uppercase tracking-wide ${SEV_STYLE[row.severity] ?? appMeta}`}>
                      {row.severity}
                    </span>
                  </div>
                </div>
                <p className={`mt-2 text-muted ${appMeta}`}>
                  {row.status} · asset {row.assetCriticality} · detected{" "}
                  {new Date(row.detectedAt).toLocaleString()}
                  {row.incidentId ? (
                    <>
                      {" · "}
                      <Link href={`/incidents/${row.incidentId}`} className="text-accent hover:underline">
                        incident
                      </Link>
                    </>
                  ) : null}
                  {row.penTestEngagementId ? (
                    <>
                      {" · "}
                      <Link href="/changes/pentest" className="text-accent hover:underline">
                        {row.penTestEngagementName ?? "pen-test"}
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PlaceholderCard>
    </>
  );
}
