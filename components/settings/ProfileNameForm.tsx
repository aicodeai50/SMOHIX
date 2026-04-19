"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { appBody, appLabel, appMeta } from "@/lib/app-typography";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const MAX_LEN = 120;

export function ProfileNameForm({
  initialFullName,
  email,
}: {
  /** Stored `user_metadata.full_name` only (not email fallback). */
  initialFullName: string;
  email: string;
}) {
  const router = useRouter();
  const configured = hasSupabaseAuth();
  const [fullName, setFullName] = useState(initialFullName);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setFullName(initialFullName);
    });
  }, [initialFullName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (!configured) {
      setError("Sign-in is not configured for this deployment.");
      return;
    }
    const trimmed = fullName.trim();
    if (trimmed.length > MAX_LEN) {
      setError(`Use at most ${MAX_LEN} characters.`);
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      setFullName(trimmed);
      setOk("Saved. Your name updates across the console.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="profile-email" className={`mb-1.5 block ${appLabel}`}>
          Email
        </label>
        <p
          id="profile-email"
          className="rounded-lg border border-border/80 bg-background/40 px-3 py-2 font-mono text-[13px] text-foreground/85"
        >
          {email}
        </p>
        <p className={`mt-1.5 ${appMeta}`}>Email is managed by your sign-in provider.</p>
      </div>
      <div>
        <label htmlFor="profile-full-name" className={`mb-1.5 block ${appLabel}`}>
          Display name
        </label>
        <input
          id="profile-full-name"
          name="full_name"
          type="text"
          autoComplete="name"
          maxLength={MAX_LEN}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="How you want to appear in the console"
          className={`h-11 w-full max-w-md rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/50 focus:ring-2 ${appBody}`}
        />
      </div>
      {error ? (
        <p className="rounded-lg border border-danger/30 bg-danger-dim/50 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className={`rounded-lg border border-success/25 bg-success-dim/40 px-3 py-2 text-success ${appBody}`} role="status">
          {ok}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className={`rounded-lg bg-accent px-4 py-2 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60 ${appBody}`}
      >
        {loading ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
