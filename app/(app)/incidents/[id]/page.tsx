import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Incident ${id}`,
  };
}

const timeline = [
  { t: "14:02", text: "SLO breach detected — p99 > 800ms" },
  { t: "14:03", text: "Copilot correlated deploy svc/api@7.4.2" },
  { t: "14:05", text: "Dry-run rollback queued — awaiting approval" },
];

export default async function IncidentDetailPage({ params }: Props) {
  const { id } = await params;
  if (!/^inc-\d+$/.test(id)) {
    notFound();
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/incidents"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Incidents
        </Link>
      </div>
      <PageHeader
        title={id}
        description="Timeline, linked changes, and approval state. Connect your CMDB and deploy feed for live data."
      />
      <PlaceholderCard title="Timeline">
        <ul className="space-y-3 font-mono text-sm">
          {timeline.map((row) => (
            <li key={row.t + row.text} className="flex gap-4">
              <span className="shrink-0 text-muted">{row.t}</span>
              <span className="text-foreground/90">{row.text}</span>
            </li>
          ))}
        </ul>
      </PlaceholderCard>
    </>
  );
}
