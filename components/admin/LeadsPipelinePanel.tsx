"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { INQUIRY_TYPES } from "@/lib/contact-form";
import { LEAD_PRIORITIES, LEAD_STATUSES, leadStatusLabel } from "@/lib/revops/types";
import { EMAIL_TEMPLATES } from "@/lib/revops/email-templates";
import { mBody } from "@/lib/marketing-layout";

type LeadRow = {
  id: string;
  referenceId: string;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  inquiryType: string;
  problemSummary: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  notes: string | null;
  nextAction: string | null;
  followUpDate: string | null;
  sourceLabel: string | null;
  pilotProjectId: string | null;
  metadata: Record<string, unknown>;
};

type ActivityRow = {
  id: string;
  createdAt: string;
  eventType: string;
  summary: string;
  actorEmail: string;
};

function statusBadgeClass(status: string): string {
  if (status === "won") return "border-accent/40 text-accent";
  if (status === "spam" || status === "closed") return "border-white/10 text-muted";
  if (status.includes("pilot")) return "border-primary-muted/40 text-primary-muted";
  return "border-white/[0.12] text-foreground";
}

export function LeadsPipelinePanel({ highlightRef }: { highlightRef?: string | null }) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"table" | "board">("table");
  const [inquiryType, setInquiryType] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [draft, setDraft] = useState<Partial<LeadRow>>({});
  const [emailPreview, setEmailPreview] = useState<string | null>(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (inquiryType) params.set("inquiry_type", inquiryType);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (overdue) params.set("overdue", "1");
    if (search.trim()) params.set("q", search.trim());
    return params;
  }, [page, inquiryType, status, priority, overdue, search]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/leads?${buildParams().toString()}`);
    if (res.status === 403 || res.status === 401) {
      setError("You do not have access to lead administration.");
      setLeads([]);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("Could not load leads.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setLeads(data.leads ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
    if (highlightRef) {
      const match = (data.leads as LeadRow[] | undefined)?.find((l) => l.referenceId === highlightRef);
      if (match) setSelectedId(match.id);
    }
  }, [buildParams, highlightRef]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await reload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    if (!selectedId) {
      queueMicrotask(() => {
        setActivity([]);
        setDraft({});
      });
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/leads/${selectedId}`);
      if (cancelled || !res.ok) return;
      const data = await res.json();
      setActivity(data.activity ?? []);
      setDraft(data.lead ?? {});
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function saveLead() {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/leads/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: draft.status,
        notes: draft.notes,
        assignedTo: draft.assignedTo,
        nextAction: draft.nextAction,
        followUpDate: draft.followUpDate,
        priority: draft.priority,
        sourceLabel: draft.sourceLabel,
      }),
    });
    if (res.ok) {
      await reload();
      const detail = await fetch(`/api/admin/leads/${selectedId}`);
      if (detail.ok) {
        const data = await detail.json();
        setActivity(data.activity ?? []);
      }
    }
  }

  async function convertToPilot() {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/leads/${selectedId}/convert-pilot`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.pilot?.id) {
      window.location.href = `/admin/pilots/${data.pilot.id}`;
    }
  }

  async function prepareEmail(templateId: string, send: boolean) {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/leads/${selectedId}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, send }),
    });
    const data = await res.json();
    if (data.mailto) {
      if (send && data.sent) {
        setEmailPreview("Email sent.");
      } else {
        setEmailPreview(data.text ?? null);
        if (!send) window.open(data.mailto, "_blank");
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const selected = leads.find((l) => l.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "table" ? "primary" : "secondary"}
            onClick={() => setView("table")}
          >
            Table
          </Button>
          <Button
            size="sm"
            variant={view === "board" ? "primary" : "secondary"}
            onClick={() => setView("board")}
          >
            Board
          </Button>
        </div>
        <a
          href={`/api/admin/leads/export?${buildParams().toString()}`}
          className="text-sm font-medium text-accent hover:underline"
        >
          Export CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={inquiryType}
          onChange={(e) => {
            setPage(1);
            setInquiryType(e.target.value);
          }}
          className="rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm"
          aria-label="Filter by inquiry type"
        >
          <option value="">All inquiry types</option>
          {INQUIRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm"
          aria-label="Filter by stage"
        >
          <option value="">All stages</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {leadStatusLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => {
            setPage(1);
            setPriority(e.target.value);
          }}
          className="rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {LEAD_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => {
              setPage(1);
              setOverdue(e.target.checked);
            }}
          />
          Overdue follow-ups
        </label>
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="min-w-[12rem] flex-1 rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm"
          aria-label="Search leads"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-warning">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className={`text-sm ${mBody}`}>Loading leads…</p>
      ) : view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {LEAD_STATUSES.map((stage) => (
            <div key={stage} className="min-w-[14rem] shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {leadStatusLabel(stage)}
              </h3>
              <ul className="mt-2 space-y-2">
                {leads
                  .filter((l) => l.status === stage)
                  .map((lead) => (
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(lead.id)}
                        className="w-full rounded-lg border border-white/[0.08] bg-surface px-2 py-2 text-left text-xs hover:border-accent/30"
                      >
                        <span className="font-mono text-accent">{lead.referenceId}</span>
                        <p className="mt-1 font-medium text-foreground">{lead.company}</p>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/[0.08] text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Reference</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${
                    selectedId === lead.id ? "bg-accent/5" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(lead.id)}
                      className="font-mono text-xs text-accent hover:underline"
                    >
                      {lead.referenceId}
                    </button>
                  </td>
                  <td className="px-3 py-2">{lead.company}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusBadgeClass(lead.status)}`}
                    >
                      {leadStatusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize">{lead.priority}</td>
                  <td className="px-3 py-2 text-muted">{lead.assignedTo ?? "—"}</td>
                  <td className="px-3 py-2 text-muted">
                    {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div
          role="dialog"
          aria-labelledby="lead-detail-heading"
          className="rounded-xl border border-white/[0.1] bg-white/[0.02] p-5"
        >
          <h2 id="lead-detail-heading" className="text-lg font-semibold text-foreground">
            {selected.referenceId} · {selected.company}
          </h2>
          <p className={`mt-1 text-sm ${mBody}`}>
            {selected.name} · {selected.email} · {selected.inquiryType}
          </p>
          <p className={`mt-3 text-sm ${mBody}`}>{selected.problemSummary}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs">
              Stage
              <select
                value={draft.status ?? selected.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {leadStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Priority
              <select
                value={draft.priority ?? selected.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
              >
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Owner
              <input
                value={draft.assignedTo ?? selected.assignedTo ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, assignedTo: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              Follow-up date
              <input
                type="date"
                value={(draft.followUpDate ?? selected.followUpDate ?? "").slice(0, 10)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    followUpDate: e.target.value ? `${e.target.value}T09:00:00.000Z` : null,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              Next action
              <input
                value={draft.nextAction ?? selected.nextAction ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, nextAction: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <label className="mt-3 block text-xs">
            Internal notes
            <textarea
              rows={3}
              value={draft.notes ?? selected.notes ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-2 py-1.5 text-sm"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={saveLead}>
              Save
            </Button>
            {!selected.pilotProjectId ? (
              <Button size="sm" variant="secondary" onClick={convertToPilot}>
                Create pilot
              </Button>
            ) : (
              <Link href={`/admin/pilots/${selected.pilotProjectId}`}>
                <Button size="sm" variant="secondary">
                  View pilot
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-muted">Email templates</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMAIL_TEMPLATES.map((t) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant="secondary"
                  onClick={() => prepareEmail(t.id, false)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            {emailPreview ? (
              <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-black/30 p-2 text-xs">
                {emailPreview}
              </pre>
            ) : null}
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">History</h3>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
              {activity.map((a) => (
                <li key={a.id} className="text-muted">
                  {new Date(a.createdAt).toLocaleString()} · {a.summary}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs ${mBody}`}>
          Page {page} of {totalPages} · {total} total
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
