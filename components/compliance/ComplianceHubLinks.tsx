import Link from "next/link";

import { appBody } from "@/lib/app-typography";

/** Shared compliance console cross-links — avoids duplicating long link footers on every page. */
export function ComplianceHubLinks({ className }: { className?: string }) {
  const base = className ?? `-mt-4 mb-4 ${appBody}`;
  return (
    <p className={base}>
      <Link href="/governance/compliance/inherited-control-gaps" className="text-accent hover:underline">
        Vendor control gaps
      </Link>
      {" · "}
      <Link href="/governance/compliance/evidence-request-sla" className="text-accent hover:underline">
        Request SLA
      </Link>
      {" · "}
      <Link href="/governance/compliance/evidence-requests" className="text-accent hover:underline">
        Evidence requests
      </Link>
      {" · "}
      <Link href="/governance/compliance/exception-register" className="text-accent hover:underline">
        Exception register
      </Link>
      {" · "}
      <Link href="/governance/compliance/control-ownership" className="text-accent hover:underline">
        Ownership matrix
      </Link>
      {" · "}
      <Link href="/governance/compliance/attestation-renewal" className="text-accent hover:underline">
        Renewal calendar
      </Link>
      {" · "}
      <Link href="/governance/compliance/committee-meeting-pack" className="text-accent hover:underline">
        Committee pack
      </Link>
      {" · "}
      <Link href="/governance/compliance/control-health-scorecard" className="text-accent hover:underline">
        Health scorecard
      </Link>
      {" · "}
      <Link href="/governance/compliance/posture-score" className="text-accent hover:underline">
        Posture score
      </Link>
      {" · "}
      <Link href="/governance/compliance/program" className="text-accent hover:underline">
        Program dashboard
      </Link>
      {" · "}
      <Link href="/governance/compliance/executive-summary" className="text-accent hover:underline">
        Executive summary
      </Link>
      {" · "}
      <Link href="/governance/compliance/calendar" className="text-accent hover:underline">
        Calendar
      </Link>
      {" · "}
      <Link href="/governance/compliance/mapping-digest" className="text-accent hover:underline">
        Mapping digest
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-ics" className="text-accent hover:underline">
        ICS export
      </Link>
      {" · "}
      <Link href="/governance/compliance/runbooks" className="text-accent hover:underline">
        Gap runbooks
      </Link>
      {" · "}
      <Link href="/governance/compliance/bundles" className="text-accent hover:underline">
        Evidence bundles
      </Link>
      {" · "}
      <Link href="/governance/compliance/workbook" className="text-accent hover:underline">
        Assessor workbook
      </Link>
      {" · "}
      <Link href="/governance/compliance/baseline-comparison" className="text-accent hover:underline">
        All frameworks
      </Link>
      {" · "}
      <Link href="/governance/compliance/benchmarking" className="text-accent hover:underline">
        Benchmarking
      </Link>
      {" · "}
      <Link href="/governance/compliance/risk-heatmap" className="text-accent hover:underline">
        Risk heatmap
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-heatmap" className="text-accent hover:underline">
        Obligation heatmap
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-crossover" className="text-accent hover:underline">
        Obligation crossover
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-consolidation" className="text-accent hover:underline">
        Consolidation playbook
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-forecast" className="text-accent hover:underline">
        Obligation forecast
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-whatif" className="text-accent hover:underline">
        What-if scenarios
      </Link>
      {" · "}
      <Link href="/governance/compliance/committee-capacity-budget" className="text-accent hover:underline">
        Capacity budget
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-load-balancing" className="text-accent hover:underline">
        Load balancing
      </Link>
      {" · "}
      <Link href="/governance/compliance/peak-week-staffing-digest" className="text-accent hover:underline">
        Staffing digest
      </Link>
      {" · "}
      <Link href="/governance/compliance/staffing-actions" className="text-accent hover:underline">
        Staffing actions
      </Link>
      {" · "}
      <Link
        href="/governance/compliance/staffing-action-reminders"
        className="text-accent hover:underline"
      >
        Overdue reminders
      </Link>
      {" · "}
      <Link
        href="/governance/compliance/staffing-completion-rollup"
        className="text-accent hover:underline"
      >
        Completion rollup
      </Link>
      {" · "}
      <Link
        href="/governance/compliance/staffing-sla-breach-digest"
        className="text-accent hover:underline"
      >
        SLA breach digest
      </Link>
      {" · "}
      <Link href="/governance/compliance/committee-digest" className="text-accent hover:underline">
        Committee digest
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-rollup" className="text-accent hover:underline">
        Executive rollup
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-density-alerts" className="text-accent hover:underline">
        Density alerts
      </Link>
      {" · "}
      <Link href="/governance/compliance/obligation-density-trend-history" className="text-accent hover:underline">
        Density trends
      </Link>
      {" · "}
      <Link href="/governance/compliance/attestations" className="text-accent hover:underline">
        Attestations
      </Link>
      {" · "}
      <Link href="/audit" className="text-accent hover:underline">
        Audit log
      </Link>
      {" · "}
      <Link href="/governance/policies" className="text-accent hover:underline">
        Policies
      </Link>
      {" · "}
      <Link href="/governance/compliance/policy-drift" className="text-accent hover:underline">
        Policy drift
      </Link>
      {" · "}
      <Link href="/governance/compliance/control-graph" className="text-accent hover:underline">
        Control graph
      </Link>
      {" · "}
      <Link href="/governance/compliance/regulatory-impact" className="text-accent hover:underline">
        Regulatory impact
      </Link>
      {" · "}
      <Link href="/governance/compliance/evidence-lineage" className="text-accent hover:underline">
        Evidence lineage
      </Link>
      {" · "}
      <Link href="/governance/compliance/testing-evidence-linker" className="text-accent hover:underline">
        Test evidence linker
      </Link>
      {" · "}
      <Link href="/governance/compliance/testing-schedules" className="text-accent hover:underline">
        Testing schedules
      </Link>
      {" · "}
      <Link href="/governance/compliance/scope-boundary" className="text-accent hover:underline">
        Scope boundary
      </Link>
      {" · "}
      <Link href="/governance/compliance/kpi-trends" className="text-accent hover:underline">
        KPI trends
      </Link>
    </p>
  );
}
