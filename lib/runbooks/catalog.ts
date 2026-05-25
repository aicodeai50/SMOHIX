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
  {
    slug: "grc-access-review",
    title: "Access review & MFA remediation",
    version: "2026.05.1",
    summary: "Close access-control assessment gaps with MFA, privileged access, and session reviews.",
    steps: 3,
    body: "Use when continuous assessment flags identity, authentication, or privileged-access exceptions.",
    checklist: [
      {
        id: "1",
        title: "Scope accounts",
        check: "Export org members, service accounts, and break-glass roles from audit evidence.",
      },
      {
        id: "2",
        title: "Remediate",
        check: "Enforce MFA, rotate stale credentials, revoke excess privileged grants.",
      },
      {
        id: "3",
        title: "Re-attest",
        check: "Sign off mapped controls in attestations after fresh audit events land.",
      },
    ],
  },
  {
    slug: "grc-evidence-sprint",
    title: "Evidence collection sprint",
    version: "2026.05.1",
    summary: "Generate audit and policy evidence for stale or partial compliance controls.",
    steps: 3,
    body: "Targets controls with no recent audit_log or accepted-policy linkage in the assessment window.",
    checklist: [
      {
        id: "1",
        title: "Prioritize gaps",
        check: "Sort by framework readiness impact and assessor due dates.",
      },
      {
        id: "2",
        title: "Collect",
        check: "Run guarded automations, export bundles, and attach attestation notes.",
      },
      {
        id: "3",
        title: "Verify",
        check: "Refresh evidence freshness dashboard; confirm control status improves.",
      },
    ],
  },
  {
    slug: "grc-change-hardening",
    title: "Change & guardrail hardening",
    version: "2026.05.1",
    summary: "Tighten automation guardrails and change approvals for policy-related gaps.",
    steps: 3,
    body: "Use when gaps cite missing guardrails, dry-run freshness, or change-window violations.",
    checklist: [
      {
        id: "1",
        title: "Review policies",
        check: "Open accepted automation policies tied to the failing control.",
      },
      {
        id: "2",
        title: "Harden",
        check: "Require dry-run, shrink blast radius, add approval notes on high-risk playbooks.",
      },
      {
        id: "3",
        title: "Prove",
        check: "Execute dry-run then guarded remediation; confirm audit events map to the control.",
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

export function isRunbookSlugValid(slug: string): boolean {
  const s = slug.trim();
  if (!s) return false;
  return DATA.some((r) => r.slug === s);
}

export function runbookTitleForSlug(slug: string | null | undefined): string | null {
  if (!slug?.trim()) return null;
  const r = getRunbookBySlug(slug.trim());
  return r?.title ?? null;
}
