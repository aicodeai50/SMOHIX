"use client";

import { useCallback, useEffect, useState } from "react";

import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { CodeSurface } from "@/components/architecture";
import { appBody, appLabel, appMeta, appPanelTitle } from "@/lib/app-typography";

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
  sessionScoped = false,
  setupStep,
  returnHref,
}: {
  initialKeys: ApiKeyRow[];
  serviceRoleConfigured: boolean;
  /** Keys stored per browser session until Supabase auth is on. */
  sessionScoped?: boolean;
  setupStep?: string;
  returnHref?: string | null;
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
      setErr(j.message ?? "Could not refresh API keys. Please try again.");
      return;
    }
    setKeys(j.keys ?? []);
    setErr(null);
  }, []);

  useEffect(() => {
    if (!sessionScoped) return;
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [sessionScoped, refresh]);

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
        setErr(j.message ?? "Could not create API key. Check workspace configuration and retry.");
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
    if (!confirm("Revoke this API key? Requests using this key will stop immediately.")) {
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
        setErr(j.message ?? "Could not revoke API key. Please retry.");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const active = keys.filter((k) => !k.revoked_at);
  const inApiKeyWizardStep = setupStep === "api-key" && typeof returnHref === "string" && returnHref.startsWith("/");

  return (
    <div className="space-y-6">
      {inApiKeyWizardStep && active.length > 0 ? (
        <p className={`rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-emerald-100 ${appBody}`}>
          API key step complete.{" "}
          <a href={returnHref} className="font-semibold text-emerald-200 underline-offset-2 hover:underline">
            Continue setup wizard →
          </a>
        </p>
      ) : null}
      {sessionScoped ? (
        <p className={`rounded-lg border border-accent/25 bg-accent/[0.08] px-4 py-3 text-foreground/90 ${appBody}`}>
          <span className="font-medium text-foreground">Session-scoped keys.</span> Stored in
          server memory for this browser session and used to authenticate{" "}
          <span className="font-mono">/api/reasoning/*</span> and{" "}
          <span className="font-mono">/api/robot/*</span>. They do not survive deploy or cold start;
          connect Supabase for durable keys.
        </p>
      ) : !serviceRoleConfigured ? (
        <p className={`rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100/90 ${appBody}`}>
          Server configuration still needs a service role so API keys can authenticate proxy
          requests (<span className="font-mono">/api/reasoning</span>,{" "}
          <span className="font-mono">/api/robot</span>). You can create keys now; they work for
          proxy calls once that configuration is complete.
        </p>
      ) : null}

      <div className={`rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 ${appMeta}`}>
        <p className="font-medium text-foreground/90">Security guidance</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Store secrets in environment variables or a secret manager — never in Git.</li>
          <li>The full key is shown only once at creation; we store a hash and prefix afterward.</li>
          <li>Revoke immediately if a key may be exposed, then mint a replacement.</li>
          <li>
            API keys authenticate connector proxies only. Alert ingest and console routes use other
            credentials — see{" "}
            <a href="/docs/api#api-keys" className="font-medium text-accent hover:underline">
              API documentation
            </a>
            .
          </li>
        </ul>
      </div>

      {err ? (
        <p className={`rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200/90 ${appBody}`}>
          {err}
        </p>
      ) : null}

      {minted ? (
        <div className="rounded-xl border border-accent/40 bg-surface-elevated/40 p-5">
          <p className={`font-medium text-foreground ${appBody}`}>Copy your new key now</p>
          <p className={`mt-2 ${appMeta}`}>
            This value is never shown again. Store it in a password manager or secret store.
          </p>
          <CodeSurface label="Secret · shown once" className="mt-3">
            <pre className={`font-mono text-foreground ${appMeta}`}>{minted}</pre>
          </CodeSurface>
          <div className="mt-4 flex flex-wrap gap-2">
            {inApiKeyWizardStep ? (
              <button
                type="button"
                className={`rounded-lg bg-emerald-500 px-4 py-2 font-medium text-background ${appBody}`}
                onClick={async () => {
                  await navigator.clipboard.writeText(minted);
                  window.location.assign(returnHref);
                }}
              >
                Copy and continue setup wizard
              </button>
            ) : null}
            <button
              type="button"
              className={`rounded-lg bg-accent px-4 py-2 font-medium text-background ${appBody}`}
              onClick={async () => {
                await navigator.clipboard.writeText(minted);
              }}
            >
              Copy to clipboard
            </button>
            <button
              type="button"
              className={`rounded-lg border border-border px-4 py-2 text-muted hover:text-foreground ${appBody}`}
              onClick={() => {
                if (inApiKeyWizardStep) {
                  window.location.assign(returnHref);
                  return;
                }
                setMinted(null);
              }}
            >
              {inApiKeyWizardStep ? "Continue setup wizard" : "Done"}
            </button>
          </div>
        </div>
      ) : null}

      <div id="api-key-create" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="api-key-name" className={appLabel}>
            Label (optional)
          </label>
          <input
            id="api-key-name"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. CI, local script, Grafana"
            className={`mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-foreground placeholder:text-muted/60 ${appBody}`}
            maxLength={80}
            disabled={busy}
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className={`h-10 shrink-0 rounded-lg bg-accent px-4 font-medium text-background disabled:opacity-50 ${appBody}`}
        >
          {busy ? "Working…" : "Create API key"}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface/80">
        <div className="border-b border-border px-5 py-3">
          <h2 className={appPanelTitle}>Active keys</h2>
          <p className={`mt-1 ${appMeta}`}>
            Use{" "}
            <span className="font-mono text-foreground/80">
              Authorization: Bearer &lt;key&gt;
            </span>{" "}
            or header{" "}
            <span className="font-mono text-foreground/80">X-Smohix-Api-Key</span> on same-origin
            requests to <span className="font-mono">/api/reasoning/…</span> and{" "}
            <span className="font-mono">/api/robot/…</span>.
          </p>
        </div>
        {active.length === 0 ? (
          <div className="border-t border-border px-4 py-8 sm:px-6">
            <ConsoleEmptyState
              title="No API keys yet"
              description="Create an API key to authenticate server-side scripts against the same-origin reasoning and robot proxies. Label each key by integration so you can revoke one safely."
              ctas={[
                { href: "#api-key-create", label: "Create API key" },
                { href: "/docs/api#api-keys", label: "API key documentation", variant: "secondary" },
              ]}
              footnote={
                <p>
                  Send{" "}
                  <span className="font-mono text-foreground/80">
                    Authorization: Bearer &lt;key&gt;
                  </span>{" "}
                  or header{" "}
                  <span className="font-mono text-foreground/80">X-Smohix-Api-Key</span> on
                  requests to <span className="font-mono">/api/reasoning/…</span> and{" "}
                  <span className="font-mono">/api/robot/…</span>. Keys do not use fine-grained
                  scopes today. Other routes use your session or specialized tokens.
                </p>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {active.map((k) => (
              <li
                key={k.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{k.name}</p>
                  <p className={`mt-1 font-mono ${appMeta}`}>{k.key_prefix}</p>
                  <p className={`mt-1 ${appMeta}`}>
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
                  className={`shrink-0 rounded-lg border border-border px-3 py-1.5 text-muted hover:border-red-500/40 hover:text-red-300 disabled:opacity-50 ${appBody}`}
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
