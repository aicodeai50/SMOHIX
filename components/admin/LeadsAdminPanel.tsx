"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { INQUIRY_TYPES } from "@/lib/contact-form";
import { LEAD_STATUSES } from "@/lib/contact/leads";
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
  notes: string | null;
  metadata: Record<string, unknown>;
};

export function LeadsAdminPanel({ highlightRef }: { highlightRef?: string | null }) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [inquiryType, setInquiryType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchLeads() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (inquiryType) params.set("inquiry_type", inquiryType);
      if (status) params.set("status", status);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (cancelled) return;

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
      if (cancelled) return;

      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setLoading(false);

      if (highlightRef) {
        const match = (data.leads as LeadRow[] | undefined)?.find(
          (l) => l.referenceId === highlightRef,
        );
        if (match) setExpandedId(match.id);
      }
    }

    void fetchLeads();
    return () => {
      cancelled = true;
    };
  }, [page, inquiryType, status, search, highlightRef]);

  const reload = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (inquiryType) params.set("inquiry_type", inquiryType);
    if (status) params.set("status", status);
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/admin/leads?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setLeads(data.leads ?? []);
    setTotal(data.total ?? 0);
  }, [page, inquiryType, status, search]);

  async function updateLead(id: string, patch: { status?: string; notes?: string }) {
    const res = await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) void reload();
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6">
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
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search email, company, reference…"
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
      ) : leads.length === 0 ? (
        <p className={`text-sm ${mBody}`}>No leads match your filters.</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => {
            const expanded = expandedId === lead.id;
            const pilotScore =
              typeof lead.metadata?.pilot_qualification_score === "number"
                ? lead.metadata.pilot_qualification_score
                : null;
            return (
              <li
                key={lead.id}
                className={`rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 ${
                  lead.referenceId === highlightRef ? "border-accent/40" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-accent">{lead.referenceId}</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {lead.company} · {lead.inquiryType}
                    </p>
                    <p className={`mt-1 text-sm ${mBody}`}>
                      {lead.name} · {lead.email}
                    </p>
                    <p className={`mt-1 text-xs text-muted`}>
                      {new Date(lead.createdAt).toLocaleString()} · status: {lead.status}
                      {pilotScore !== null ? ` · pilot score: ${pilotScore}/6` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLead(lead.id, { status: e.target.value })}
                      className="rounded-lg border border-white/[0.1] bg-surface px-2 py-1 text-xs"
                      aria-label={`Update status for ${lead.referenceId}`}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setExpandedId(expanded ? null : lead.id)}
                    >
                      {expanded ? "Hide" : "Details"}
                    </Button>
                  </div>
                </div>
                {expanded ? (
                  <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
                    <p className={`text-sm ${mBody}`}>{lead.problemSummary}</p>
                    <div>
                      <label className="text-xs font-medium text-muted" htmlFor={`notes-${lead.id}`}>
                        Internal notes
                      </label>
                      <textarea
                        id={`notes-${lead.id}`}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-white/[0.1] bg-surface px-3 py-2 text-sm"
                        defaultValue={lead.notes ?? ""}
                        onChange={(e) =>
                          setNoteDraft((d) => ({ ...d, [lead.id]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          updateLead(lead.id, {
                            notes: noteDraft[lead.id] ?? lead.notes ?? "",
                          })
                        }
                      >
                        Save notes
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs ${mBody}`}>
          Page {page} of {totalPages} · {total} total
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
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
