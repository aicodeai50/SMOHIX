"use client";

import { useCallback, useEffect, useState } from "react";

import { appBody, appLabel, appMeta, appPanelTitle } from "@/lib/app-typography";

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
  setupStep,
  returnHref,
}: {
  serviceRoleConfigured: boolean;
  setupStep?: string;
  returnHref?: string | null;
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
    queueMicrotask(() => {
      void refresh();
    });
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
  const inIngestWizardStep =
    setupStep === "ingest-token" && typeof returnHref === "string" && returnHref.startsWith("/");
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://your-deployment";

  return (
    <div className="space-y-6">
      {inIngestWizardStep && active.length > 0 ? (
        <p className={`rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-emerald-100 ${appBody}`}>
          Ingest token step complete.{" "}
          <a href={returnHref} className="font-semibold text-emerald-200 underline-offset-2 hover:underline">
            Continue setup wizard →
          </a>
        </p>
      ) : null}
      {!serviceRoleConfigured ? (
        <p className={`rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100/90 ${appBody}`}>
          Set <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> so the alert webhook can
          verify tokens and create incidents.
        </p>
      ) : null}
      {loadErr ? (
        <p className={`rounded-lg border border-border bg-surface px-3 py-2 text-muted ${appBody}`}>
          {loadErr}
        </p>
      ) : null}
      {err ? (
        <p className={`rounded-lg border border-danger/30 bg-danger-dim/50 px-3 py-2 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div>
        <h3 className={`${appPanelTitle} text-foreground/95`}>Alert → incident webhook</h3>
        <p className={`mt-1 text-muted ${appMeta}`}>
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
          <p className={`font-medium text-foreground/90 ${appMeta}`}>New token (copy once)</p>
          <code className={`mt-2 block break-all font-mono text-accent ${appBody}`}>{minted}</code>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {inIngestWizardStep ? (
              <button
                type="button"
                className={`rounded-lg bg-emerald-500 px-3 py-1.5 font-medium text-background ${appBody}`}
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
              className={`font-medium text-muted hover:text-foreground ${appMeta}`}
              onClick={() => {
                if (inIngestWizardStep) {
                  window.location.assign(returnHref);
                  return;
                }
                setMinted(null);
              }}
            >
              {inIngestWizardStep ? "Continue setup wizard" : "Dismiss"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="ingest-label" className={`mb-1 block ${appLabel}`}>
            Label (optional)
          </label>
          <input
            id="ingest-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
            placeholder="Grafana EU"
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className={`h-10 rounded-lg bg-accent px-4 font-medium text-background disabled:opacity-50 ${appBody}`}
        >
          {busy ? "Working…" : "Create ingest token"}
        </button>
      </div>

      <ul className={`space-y-2 ${appBody}`}>
        {active.length === 0 ? (
          <li className="text-muted">No active ingest tokens yet.</li>
        ) : (
          active.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-[border-color,background-color] duration-200 hover:border-white/[0.1] hover:bg-white/[0.035]"
            >
              <span>
                <span className="font-medium text-foreground/90">{t.name}</span>
                <span className={`ml-2 font-mono ${appMeta}`}>{t.key_prefix}</span>
              </span>
              <button
                type="button"
                className={`font-medium text-danger hover:underline ${appMeta}`}
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
