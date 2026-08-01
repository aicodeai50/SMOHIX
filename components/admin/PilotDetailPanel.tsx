"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { PILOT_STATUSES, pilotStatusLabel } from "@/lib/revops/types";
import { mBody } from "@/lib/marketing-layout";

type PilotDetail = {
  id: string;
  referenceId: string;
  leadId: string | null;
  name: string;
  organization: string;
  contactName: string;
  contactEmail: string;
  category: string | null;
  relatedProduct: string | null;
  objective: string | null;
  scope: string | null;
  status: string;
  startDate: string | null;
  targetReviewDate: string | null;
  owner: string | null;
  risks: string | null;
  nextAction: string | null;
  notes: string | null;
  discoveryCallDate: string | null;
  pilotKickoffDate: string | null;
  reviewMeetingDate: string | null;
};

type ActivityRow = {
  id: string;
  createdAt: string;
  summary: string;
};

export function PilotDetailPanel({ pilotId }: { pilotId: string }) {
  const [pilot, setPilot] = useState<PilotDetail | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [draft, setDraft] = useState<Partial<PilotDetail>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/pilots/${pilotId}`);
      if (cancelled || !res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPilot(data.pilot);
      setDraft(data.pilot);
      setActivity(data.activity ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [pilotId]);

  async function save() {
    const res = await fetch(`/api/admin/pilots/${pilotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const detail = await fetch(`/api/admin/pilots/${pilotId}`);
      if (detail.ok) {
        const data = await detail.json();
        setPilot(data.pilot);
        setActivity(data.activity ?? []);
      }
    }
  }

  if (loading) return <p className={`text-sm ${mBody}`}>Loading pilot…</p>;
  if (!pilot) return <p className="text-sm text-warning">Pilot not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-accent">{pilot.referenceId}</p>
          <h1 className="text-2xl font-bold text-foreground">{pilot.name}</h1>
          <p className={`mt-1 ${mBody}`}>
            {pilot.organization} · {pilot.contactName} ({pilot.contactEmail})
          </p>
          {pilot.leadId ? (
            <Link href={`/admin/leads?ref=${pilot.referenceId}`} className="text-sm text-accent hover:underline">
              View source lead
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/pilots/${pilotId}/proposal?format=html`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="secondary">
              Proposal (HTML)
            </Button>
          </a>
          <a href={`/api/admin/pilots/${pilotId}/proposal?format=markdown`}>
            <Button size="sm" variant="secondary">
              Proposal (MD)
            </Button>
          </a>
          <a href={`/api/admin/pilots/${pilotId}/calendar?event=all`}>
            <Button size="sm" variant="secondary">
              Download .ics
            </Button>
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">
          Status
          <select
            value={draft.status ?? pilot.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
          >
            {PILOT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {pilotStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Owner
          <input
            value={draft.owner ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          Objective
          <textarea
            rows={2}
            value={draft.objective ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, objective: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          Scope
          <textarea
            rows={2}
            value={draft.scope ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, scope: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          Risks
          <textarea
            rows={2}
            value={draft.risks ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, risks: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          Notes
          <textarea
            rows={3}
            value={draft.notes ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <Button size="sm" onClick={save}>
        Save pilot
      </Button>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Activity</h2>
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {activity.map((a) => (
            <li key={a.id}>
              {new Date(a.createdAt).toLocaleString()} · {a.summary}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
