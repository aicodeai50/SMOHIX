import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Immutable record of actions and approvals.",
};

const entries = [
  {
    ts: "2026-04-17T18:02:11Z",
    actor: "system",
    action: "dry_run.automation",
    target: "restart_stuck_workers · staging",
    outcome: "success",
  },
  {
    ts: "2026-04-17T18:01:02Z",
    actor: "sre@team",
    action: "approval.requested",
    target: "scale_api_tier · prod",
    outcome: "pending",
  },
];

export default function AuditPage() {
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Searchable trail for compliance: actor, action, target, policy match, and outcome. Export hooks come next."
      />
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/80 font-mono text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Time (UTC)</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs">
            {entries.map((e) => (
              <tr key={e.ts + e.action} className="hover:bg-surface-elevated/40">
                <td className="px-4 py-3 text-muted">{e.ts}</td>
                <td className="px-4 py-3 text-foreground">{e.actor}</td>
                <td className="px-4 py-3 text-accent">{e.action}</td>
                <td className="px-4 py-3 text-muted">{e.target}</td>
                <td className="px-4 py-3 capitalize text-muted">{e.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
