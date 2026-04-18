"use client";

import Link from "next/link";
import { useState } from "react";

import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { AuthCard } from "./AuthCard";

export function ForgotPasswordForm() {
  const configured = hasSupabaseAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!configured) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
      setInfo("If an account exists for that email, you will receive a link to choose a new password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We will email you a secure link to set a new password."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-medium text-muted">
            Email
          </label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-ring/50 focus:ring-2"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted" role="status">
            {info}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-accent text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
        <p className="text-center text-sm text-muted">
          <Link href="/auth/sign-in" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
