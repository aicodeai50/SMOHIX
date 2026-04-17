import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";

export const metadata: Metadata = {
  title: "Incidents",
  description: "Active and recent incidents with timelines.",
};

const demo = [
  {
    id: "inc-2041",
    title: "Elevated API latency — us-east",
    severity: "high",
    status: "investigating",
    updated: "2m ago",
  },
  {
    id: "inc-2038",
    title: "Worker queue backlog",
    severity: "medium",
    status: "mitigated",
    updated: "1h ago",
  },
];

export default function IncidentsPage() {
  return (
    <>
      <PageHeader
        title="Incidents"
        description="Unified view of signals, ownership, and timeline entries. Wire to your incident store and alerting pipeline."
      />
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface/80 font-mono text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Id</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {demo.map((row) => (
              <tr key={row.id} className="hover:bg-surface-elevated/40">
                <td className="px-4 py-3 font-mono text-xs text-accent">
                  <Link href={`/incidents/${row.id}`} className="hover:underline">
                    {row.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-foreground">{row.title}</td>
                <td className="px-4 py-3 capitalize text-muted">{row.severity}</td>
                <td className="px-4 py-3 capitalize text-muted">{row.status}</td>
                <td className="px-4 py-3 text-muted">{row.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
