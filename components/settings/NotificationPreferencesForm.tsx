"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

const PREFS = [
  { key: "incidents", label: "Incident updates" },
  { key: "approvals", label: "Approval requests" },
  { key: "billing", label: "Billing & receipts" },
  { key: "compliance", label: "Compliance digests" },
] as const;

export function NotificationPreferencesForm({
  initial,
}: {
  initial: Record<string, boolean>;
}) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const p of PREFS) {
      out[p.key] = initial[p.key] ?? true;
    }
    return out;
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(res.ok);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {PREFS.map((p) => (
        <label
          key={p.key}
          className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-black/20 px-4 py-3"
        >
          <span className="text-sm text-foreground/90">{p.label}</span>
          <input
            type="checkbox"
            checked={prefs[p.key] ?? true}
            onChange={(e) =>
              setPrefs((prev) => ({ ...prev, [p.key]: e.target.checked }))
            }
            className="h-4 w-4 rounded border-white/20 accent-accent"
          />
        </label>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button size="sm" onClick={save} disabled={loading}>
          {loading ? "Saving…" : "Save preferences"}
        </Button>
        {saved ? <span className="text-xs text-success">Saved</span> : null}
      </div>
    </div>
  );
}
