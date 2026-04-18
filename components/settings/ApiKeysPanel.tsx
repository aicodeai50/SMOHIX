"use client";

import { useCallback, useEffect, useState } from "react";

export type ApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export function ApiKeysPanel({
  initialKeys,
  serviceRoleConfigured,
  demoMode = false,
}: {
  initialKeys: ApiKeyRow[];
  serviceRoleConfigured: boolean;
  /** In-memory keys before Supabase; refresh after middleware sets the dev cookie. */
  demoMode?: boolean;
}) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys);
  const [label, setLabel] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/user/api-keys", { credentials: "include" });
    const j = (await r.json()) as { keys?: ApiKeyRow[]; message?: string };
    if (!r.ok) {
      setErr(j.message ?? "Could not refresh the list.");
      return;
    }
    setKeys(j.keys ?? []);
    setErr(null);
  }, []);

  useEffect(() => {
    if (demoMode) {
      void refresh();
    }
  }, [demoMode, refresh]);

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const body =
        label.trim().length > 0 ? JSON.stringify({ name: label.trim() }) : "{}";
      const r = await fetch("/api/user/api-keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const j = (await r.json()) as { key?: string; message?: string };
      if (!r.ok) {
        setErr(j.message ?? "Could not create a key.");
        return;
      }
      if (j.key) {
        setMinted(j.key);
      }
      setLabel("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Scripts using it will stop working.")) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/user/api-keys/${id}`, {
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

  const active = keys.filter((k) => !k.revoked_at);

  return (
    <div className="space-y-6">
      {demoMode ? (
        <p className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100/90">
          <span className="font-medium text-foreground/90">Demo session.</span> Keys live in
          server memory (scoped to your <span className="font-mono">shynvo_dev_tid</span> cookie)
          and authenticate{" "}
          <span className="font-mono">/api/reasoning/*</span> and{" "}
          <span className="font-mono">/api/robot/*</span> while Supabase auth is off. They disappear
          on deploy/restart; connect Supabase for real persistence.
        </p>
      ) : !serviceRoleConfigured ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          Set <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> on the server so
          API keys can authenticate proxy requests (
          <span className="font-mono">/api/reasoning</span>,{" "}
          <span className="font-mono">/api/robot</span>). You can still create keys here; they
          will work for proxy calls once the service role is configured.
        </p>
      ) : null}

      {err ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
          {err}
        </p>
      ) : null}

      {minted ? (
        <div className="rounded-xl border border-accent/40 bg-surface-elevated/40 p-5">
          <p className="text-sm font-medium text-foreground">Copy your new key now</p>
          <p className="mt-2 text-xs text-muted">
            This value is never shown again. Store it in a password manager or secret store.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-background/80 p-3 font-mono text-xs text-foreground">
            {minted}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background"
              onClick={async () => {
                await navigator.clipboard.writeText(minted);
              }}
            >
              Copy to clipboard
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
              onClick={() => setMinted(null)}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="api-key-name" className="text-xs font-medium text-muted">
            Label (optional)
          </label>
          <input
            id="api-key-name"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. CI, local script, Grafana"
            className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted/60"
            maxLength={80}
            disabled={busy}
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-medium text-background disabled:opacity-50"
        >
          {busy ? "Working…" : "Generate API key"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface/80">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Active keys</h2>
          <p className="mt-1 text-xs text-muted">
            Use{" "}
            <span className="font-mono text-foreground/80">
              Authorization: Bearer &lt;key&gt;
            </span>{" "}
            or header{" "}
            <span className="font-mono text-foreground/80">X-Shynvo-Api-Key</span> on same-origin
            requests to <span className="font-mono">/api/reasoning/…</span> and{" "}
            <span className="font-mono">/api/robot/…</span>.
          </p>
        </div>
        {active.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">No active keys yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {active.map((k) => (
              <li
                key={k.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{k.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted">{k.key_prefix}</p>
                  <p className="mt-1 text-xs text-muted">
                    Created {new Date(k.created_at).toLocaleString()}
                    {k.last_used_at
                      ? ` · Last used ${new Date(k.last_used_at).toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void revoke(k.id)}
                  className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
