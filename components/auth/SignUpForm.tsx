"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { AuthCard } from "./AuthCard";
import { PasswordField } from "./PasswordField";

export function SignUpForm() {
  const router = useRouter();
  const configured = hasSupabaseAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const trimmedName = fullName.trim();
      const { data, error: signError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          ...(trimmedName ? { data: { full_name: trimmedName } } : {}),
        },
      });
      if (signError) {
        setError(signError.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        router.push("/copilot");
        router.refresh();
        return;
      }
      setInfo("Check your email for a confirmation link to finish setting up your account.");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Sign up"
      subtitle="Create a Shynvo account to use the console. Billing tiers can be added later."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="mb-1.5 block text-xs font-medium text-muted">
            Name
          </label>
          <input
            id="signup-name"
            name="name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Rivera"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-ring/50 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-xs font-medium text-muted">
            Work email
          </label>
          <input
            id="signup-email"
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
          id="signup-password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          hint="At least 8 characters."
        />
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
