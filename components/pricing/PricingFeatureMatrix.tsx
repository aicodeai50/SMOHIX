type Cell = boolean | "partial" | string;

const FEATURES: { label: string; pro: Cell; team: Cell; enterprise: Cell }[] = [
  { label: "Incidents & timeline", pro: true, team: true, enterprise: true },
  { label: "Alert ingest (HTTP + SIEM shapes)", pro: true, team: true, enterprise: true },
  { label: "Guarded automations & dry-runs", pro: true, team: true, enterprise: true },
  { label: "Approvals queue", pro: true, team: true, enterprise: true },
  { label: "Audit log & export", pro: true, team: true, enterprise: true },
  { label: "Certificates & secrets inventory", pro: true, team: true, enterprise: true },
  { label: "Network drift & device inventory", pro: true, team: true, enterprise: true },
  { label: "Access posture & policy blocks", pro: "partial", team: true, enterprise: true },
  { label: "Service catalog & dependencies", pro: true, team: true, enterprise: true },
  { label: "Delegated approvers / org RBAC", pro: false, team: "partial", enterprise: true },
  { label: "Custom retention & compliance pack", pro: false, team: false, enterprise: true },
  { label: "Dedicated onboarding & SLA", pro: false, team: "partial", enterprise: true },
];

function CellMark({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="text-[#6ee7b7]" aria-label="Included">
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-muted/50" aria-label="Not included">
        —
      </span>
    );
  }
  if (value === "partial") {
    return <span className="text-xs font-medium text-warning">Partial</span>;
  }
  return <span className="text-xs text-muted">{value}</span>;
}

export function PricingFeatureMatrix() {
  return (
    <section className="mt-14" aria-labelledby="compare-heading">
      <h2 id="compare-heading" className="text-lg font-semibold text-foreground sm:text-xl">
        Compare plans
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Feature depth grows with plan tier. Enterprise adds procurement, retention, and org controls
        on the roadmap.
      </p>
      <div className="zentro-holo-panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03]">
              <th className="px-4 py-3 font-medium text-muted">Capability</th>
              <th className="px-4 py-3 font-medium text-foreground">Pro</th>
              <th className="px-4 py-3 font-medium text-accent">Team</th>
              <th className="px-4 py-3 font-medium text-foreground">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((row) => (
              <tr key={row.label} className="border-b border-white/[0.06] last:border-0">
                <td className="px-4 py-3 text-foreground/90">{row.label}</td>
                <td className="px-4 py-3">
                  <CellMark value={row.pro} />
                </td>
                <td className="px-4 py-3">
                  <CellMark value={row.team} />
                </td>
                <td className="px-4 py-3">
                  <CellMark value={row.enterprise} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
