import type { RunbookDetail, RunbookSummary } from "./types";

const DATA: RunbookDetail[] = [
  {
    slug: "api-latency",
    title: "API latency regression",
    version: "2026.04.1",
    summary: "Customer-facing latency or error-rate spike on edge/API tier.",
    steps: 4,
    body: "Use this when dashboards show elevated p95/p99 or 5xx without a clear deploy. Validate scope before paging dependent teams.",
    checklist: [
      {
        id: "1",
        title: "Confirm blast radius",
        check: "Scope: single region vs global; guest vs auth traffic.",
      },
      {
        id: "2",
        title: "Correlate deploys & flags",
        check: "Last 2h deploys, feature flags, autoscaling events.",
      },
      {
        id: "3",
        title: "Stabilize",
        check: "Traffic shift, rollback, or capacity bump with owner sign-off.",
      },
      {
        id: "4",
        title: "Communicate",
        check: "Status page + internal channel with ETA for next update.",
      },
    ],
  },
  {
    slug: "db-failover",
    title: "Database failover drill",
    version: "2026.03.2",
    summary: "Controlled or emergency promotion of read replica / standby.",
    steps: 3,
    body: "High-risk change — requires approvals and a maintenance window when possible.",
    checklist: [
      {
        id: "1",
        title: "Pre-checks",
        check: "Replication lag, connection limits, backup snapshot age.",
      },
      {
        id: "2",
        title: "Execute",
        check: "Follow provider runbook; verify read/write endpoints.",
      },
      {
        id: "3",
        title: "Post-verify",
        check: "Synthetic transactions + app smoke; document RTO/RPO observed.",
      },
    ],
  },
  {
    slug: "cert-rotation",
    title: "TLS certificate rotation",
    version: "2026.02.0",
    summary: "Edge certs or internal mTLS rotation without user-visible errors.",
    steps: 2,
    body: "Prefer staged rollout and monitoring on handshake failures.",
    checklist: [
      {
        id: "1",
        title: "Inventory",
        check: "SANs, expiry, automation vs manual renewals.",
      },
      {
        id: "2",
        title: "Rollout",
        check: "Deploy to canary → full; watch cert expiry and alert noise.",
      },
    ],
  },
];

export function listRunbooks(): RunbookSummary[] {
  return DATA.map(({ slug, title, version, summary, steps }) => ({
    slug,
    title,
    version,
    summary,
    steps,
  }));
}

export function getRunbookBySlug(slug: string): RunbookDetail | undefined {
  return DATA.find((r) => r.slug === slug);
}
