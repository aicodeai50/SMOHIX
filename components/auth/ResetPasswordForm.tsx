"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { AuthCard } from "./AuthCard";
import { PasswordField } from "./PasswordField";

export function ResetPasswordForm() {
  const router = useRouter();
  const configured = hasSupabaseAuth();
  const [sessionReady, setSessionReady] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured) return;

    const supabase = createBrowserSupabaseClient();

    const applyHashSession = async () => {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) return false;
      const params = new URLSearchParams(raw);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (!access_token || !refresh_token) return false;
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) return false;
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      return true;
    };

    void (async () => {
      const fromHash = await applyHashSession();
      if (fromHash) {
        setSessionReady(true);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) setSessionReady(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
        setCheckedSession(true);
      }
      if (event === "SIGNED_IN" && session) {
        setSessionReady(true);
        setCheckedSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) {
      setError("Supabase is not configured.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
      router.push("/auth/sign-in?notice=password-updated");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <AuthCard title="Reset password" subtitle="Supabase is not configured for this environment.">
        <p className="text-sm text-muted">
          Add <span className="font-mono text-foreground/90">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
          <span className="font-mono text-foreground/90">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to{" "}
          <span className="font-mono text-foreground/90">.env.local</span>.
        </p>
      </AuthCard>
    );
  }

  if (!sessionReady && !checkedSession) {
    return (
      <AuthCard title="Reset password" subtitle="Checking your reset link…">
        <p className="text-sm text-muted">One moment.</p>
      </AuthCard>
    );
  }

  if (!sessionReady) {
    return (
      <AuthCard title="Reset link invalid or expired" subtitle="We could not open a password reset session.">
        <p className="text-sm text-muted">
          Request a new link from{" "}
          <Link href="/auth/forgot-password" className="font-medium text-accent hover:underline">
            Forgot password
          </Link>{" "}
          or{" "}
          <Link href="/auth/sign-in" className="font-medium text-accent hover:underline">
            sign in
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Enter and confirm your new password below.">
      <form onSubmit={onSubmit} className="space-y-4">
        <PasswordField
          id="reset-password"
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          hint="At least 8 characters."
        />
        <PasswordField
          id="reset-password-confirm"
          label="Confirm new password"
          name="password-confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          required
          minLength={8}
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
          {loading ? "Saving…" : "Update password"}
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
