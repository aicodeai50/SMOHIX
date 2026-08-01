"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { mBody } from "@/lib/marketing-layout";

type Dashboard = {
  newLeadsCount: number;
  overdueFollowUpsCount: number;
  pilotsAwaitingActionCount: number;
  activePilotsCount: number;
  conversionCounts: {
    total: number;
    qualified: number;
    pilotProposed: number;
    pilotActive: number;
    won: number;
    closed: number;
    spam: number;
  };
  leadsBySource: { source: string; count: number }[];
  leadsByInquiryType: { inquiryType: string; count: number }[];
  recentActivity: {
    id: string;
    leadId: string;
    createdAt: string;
    eventType: string;
    summary: string;
    actorEmail: string;
  }[];
};

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-opacity hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function RevOpsDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/dashboard");
      if (cancelled) return;
      if (!res.ok) {
        setError("Could not load dashboard.");
        return;
      }
      setData(await res.json());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="text-sm text-warning">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className={`text-sm ${mBody}`}>Loading dashboard…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New leads" value={data.newLeadsCount} href="/admin/leads?status=new" />
        <StatCard
          label="Overdue follow-ups"
          value={data.overdueFollowUpsCount}
          href="/admin/leads?overdue=1"
        />
        <StatCard
          label="Pilots awaiting action"
          value={data.pilotsAwaitingActionCount}
          href="/admin/pilots"
        />
        <StatCard label="Active pilots" value={data.activePilotsCount} href="/admin/pilots?status=active" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="conversion-heading">
          <h2 id="conversion-heading" className="text-sm font-semibold text-foreground">
            Pipeline counts
          </h2>
          <ul className={`mt-3 space-y-1 text-sm ${mBody}`}>
            <li>Total leads: {data.conversionCounts.total}</li>
            <li>Qualified: {data.conversionCounts.qualified}</li>
            <li>Pilot proposed: {data.conversionCounts.pilotProposed}</li>
            <li>Pilot active: {data.conversionCounts.pilotActive}</li>
            <li>Won: {data.conversionCounts.won}</li>
            <li>Closed: {data.conversionCounts.closed}</li>
            <li>Spam: {data.conversionCounts.spam}</li>
          </ul>
        </section>

        <section aria-labelledby="inquiry-heading">
          <h2 id="inquiry-heading" className="text-sm font-semibold text-foreground">
            Leads by inquiry type
          </h2>
          <ul className={`mt-3 space-y-1 text-sm ${mBody}`}>
            {data.leadsByInquiryType.map((row) => (
              <li key={row.inquiryType}>
                {row.inquiryType}: {row.count}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="source-heading">
        <h2 id="source-heading" className="text-sm font-semibold text-foreground">
          Leads by source
        </h2>
        <ul className={`mt-3 flex flex-wrap gap-2 text-xs ${mBody}`}>
          {data.leadsBySource.map((row) => (
            <li
              key={row.source}
              className="rounded-full border border-white/[0.1] px-2 py-1"
            >
              {row.source} ({row.count})
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-sm font-semibold text-foreground">
          Recent activity
        </h2>
        <ul className="mt-3 space-y-2">
          {data.recentActivity.length === 0 ? (
            <li className={`text-sm ${mBody}`}>No activity yet.</li>
          ) : (
            data.recentActivity.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
              >
                <span className="text-muted">{new Date(a.createdAt).toLocaleString()}</span>
                <span className="mx-2 text-muted">·</span>
                <span>{a.summary}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
