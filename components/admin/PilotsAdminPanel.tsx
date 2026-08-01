"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { PILOT_STATUSES, pilotStatusLabel } from "@/lib/revops/types";
import { mBody } from "@/lib/marketing-layout";

type PilotRow = {
  id: string;
  referenceId: string;
  name: string;
  organization: string;
  status: string;
  owner: string | null;
  targetReviewDate: string | null;
  leadId: string | null;
};

export function PilotsAdminPanel() {
  const [pilots, setPilots] = useState<PilotRow[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (status) params.set("status", status);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/pilots?${params.toString()}`);
      if (cancelled || !res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPilots(data.pilots ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [status, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm"
          aria-label="Filter by pilot status"
        >
          <option value="">All statuses</option>
          {PILOT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {pilotStatusLabel(s)}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search pilots…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[12rem] flex-1 rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm"
        />
        <Link href="/api/admin/pilots/export" className="self-center text-sm font-medium text-accent hover:underline">
          Export CSV
        </Link>
      </div>

      {loading ? (
        <p className={`text-sm ${mBody}`}>Loading pilots…</p>
      ) : pilots.length === 0 ? (
        <p className={`text-sm ${mBody}`}>No pilots yet. Create one from a qualified lead.</p>
      ) : (
        <ul className="space-y-2">
          {pilots.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
            >
              <div>
                <Link href={`/admin/pilots/${p.id}`} className="font-mono text-xs text-accent hover:underline">
                  {p.referenceId}
                </Link>
                <p className="font-medium text-foreground">{p.name}</p>
                <p className={`text-sm ${mBody}`}>
                  {p.organization} · {pilotStatusLabel(p.status)}
                  {p.owner ? ` · ${p.owner}` : ""}
                </p>
              </div>
              <Link href={`/admin/pilots/${p.id}`}>
                <Button size="sm" variant="secondary">
                  Open
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
