"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { safeNextPath } from "@/lib/auth/redirect";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { AuthCard } from "./AuthCard";
import { PasswordField } from "./PasswordField";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const configured = hasSupabaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(signError.message);
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Use your Shynvo account to open the console."
    >
      {searchParams.get("error") === "auth" ? (
        <p className="mb-4 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
          Session could not be restored. Try signing in again.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="signin-email" className="mb-1.5 block text-xs font-medium text-muted">
            Email
          </label>
          <input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-ring/50 focus:ring-2"
          />
        </div>
        <PasswordField
          id="signin-password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />
        {error ? (
          <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
