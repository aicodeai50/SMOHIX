"use client";

import { useCallback, useEffect, useState } from "react";

export type AlertIngestTokenRow = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export function AlertIngestPanel({
  serviceRoleConfigured,
}: {
  serviceRoleConfigured: boolean;
}) {
  const [tokens, setTokens] = useState<AlertIngestTokenRow[]>([]);
  const [label, setLabel] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/user/alert-ingest-tokens", { credentials: "include" });
    const j = (await r.json()) as {
      tokens?: AlertIngestTokenRow[];
      message?: string;
      error?: string;
    };
    if (!r.ok) {
      setLoadErr(j.message ?? "Could not load ingest tokens.");
      setTokens([]);
      return;
    }
    setLoadErr(null);
    setTokens(j.tokens ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const body =
        label.trim().length > 0 ? JSON.stringify({ name: label.trim() }) : "{}";
      const r = await fetch("/api/user/alert-ingest-tokens", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const j = (await r.json()) as { token?: string; message?: string };
      if (!r.ok) {
        setErr(j.message ?? "Could not create token.");
        return;
      }
      if (j.token) setMinted(j.token);
      setLabel("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this ingest token? Monitoring webhooks using it will fail.")) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/user/alert-ingest-tokens/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await r.json()) as { message?: string };
      if (!r.ok) {
        setErr(j.message ?? "Could not revoke.");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const active = tokens.filter((t) => !t.revoked_at);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://your-deployment";

  return (
    <div className="space-y-6">
      {!serviceRoleConfigured ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          Set <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> so the alert webhook can
          verify tokens and create incidents.
        </p>
      ) : null}
      {loadErr ? (
        <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
          {loadErr}
        </p>
      ) : null}
      {err ? (
        <p className="rounded-lg border border-danger/30 bg-danger-dim/50 px-3 py-2 text-sm text-danger">
          {err}
        </p>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-foreground/95">Alert → incident webhook</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          POST JSON to{" "}
          <code className="rounded bg-background/50 px-1 font-mono text-[11px] text-accent/90">
            {origin}/api/integrations/alerts
          </code>{" "}
          with{" "}
          <code className="rounded bg-background/50 px-1 font-mono text-[11px]">Authorization: Bearer</code>{" "}
          and your ingest token. Body:{" "}
          <code className="font-mono text-[11px]">title</code> (required), optional{" "}
          <code className="font-mono text-[11px]">severity</code>,{" "}
          <code className="font-mono text-[11px]">status</code>,{" "}
          <code className="font-mono text-[11px]">summary</code>,{" "}
          <code className="font-mono text-[11px]">service_id</code> /{" "}
          <code className="font-mono text-[11px]">service_name</code>,{" "}
          <code className="font-mono text-[11px]">dedupe_key</code>.
        </p>
      </div>

      {minted ? (
        <div className="rounded-xl border border-accent/35 bg-accent-dim/40 px-4 py-3">
          <p className="text-xs font-medium text-foreground/90">New token (copy once)</p>
          <code className="mt-2 block break-all font-mono text-sm text-accent">{minted}</code>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-muted hover:text-foreground"
            onClick={() => setMinted(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="ingest-label" className="mb-1 block text-xs font-medium text-muted">
            Label (optional)
          </label>
          <input
            id="ingest-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none ring-ring/40 focus:ring-2"
            placeholder="Grafana EU"
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-background disabled:opacity-50"
        >
          {busy ? "Working…" : "Create ingest token"}
        </button>
      </div>

      <ul className="space-y-2 text-sm">
        {active.length === 0 ? (
          <li className="text-muted">No active ingest tokens yet.</li>
        ) : (
          active.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
            >
              <span>
                <span className="font-medium text-foreground/90">{t.name}</span>
                <span className="ml-2 font-mono text-xs text-muted">{t.key_prefix}</span>
              </span>
              <button
                type="button"
                className="text-xs font-medium text-danger hover:underline"
                onClick={() => void revoke(t.id)}
                disabled={busy}
              >
                Revoke
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
