import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = {
  title: "Automations",
  description: "Playbooks and execution via the automation backend.",
};

const rows = [
  {
    name: "Restart stuck workers",
    env: "staging",
    lastRun: "ok · 3m ago",
    risk: "low",
  },
  {
    name: "Scale API tier",
    env: "production",
    lastRun: "dry-run",
    risk: "high",
  },
];

export default function AutomationsPage() {
  return (
    <>
      <PageHeader
        title="Automations"
        description="Workflows executed by your robot backend with policy checks. High-risk steps require approvals from the Approvals view."
      />
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/80 font-mono text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Playbook</th>
              <th className="px-4 py-3">Environment</th>
              <th className="px-4 py-3">Last run</th>
              <th className="px-4 py-3">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.name} className="hover:bg-surface-elevated/40">
                <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                <td className="px-4 py-3 capitalize text-muted">{row.env}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{row.lastRun}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.risk === "high"
                        ? "text-amber-400/90"
                        : "text-emerald-400/90"
                    }
                  >
                    {row.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
