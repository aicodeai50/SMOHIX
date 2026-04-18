import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { PlaceholderCard } from "@/components/app/PlaceholderCard";
import { getIncidentForUser } from "@/lib/incidents/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  let userId = "";
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/auth/sign-in?next=/incidents/${encodeURIComponent(id)}`);
    }
    userId = user.id;
  }

  const resolved = await getIncidentForUser(userId, id);
  if (!resolved) {
    notFound();
  }

  const { row, source } = resolved;

  return (
    <>
      <div className="mb-6">
        <Link href="/incidents" className="text-sm text-muted hover:text-foreground">
          ← Incidents
        </Link>
      </div>
      {source === "demo" ? (
        <p className="mb-4 rounded-lg border border-border bg-surface-elevated/50 px-3 py-2 text-xs text-muted">
          Demo timeline — wire your CMDB and deploy feed for live data.
        </p>
      ) : null}
      <PageHeader
        title={row.title}
        description={`${row.id} · ${row.severity} · ${row.status} · updated ${row.updated}`}
      />
      <PlaceholderCard title="Timeline">
        <ul className="space-y-3 font-mono text-sm">
          {timeline.map((item) => (
            <li key={item.t + item.text} className="flex gap-4">
              <span className="shrink-0 text-muted">{item.t}</span>
              <span className="text-foreground/90">{item.text}</span>
            </li>
          ))}
        </ul>
      </PlaceholderCard>
    </>
  );
}
