import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Auth error",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-8 shadow-[0_0_0_1px_rgba(56,189,248,0.06)]">
      <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        {reason === "callback"
          ? "We could not complete sign-in from your link. The link may have expired — try signing in again."
          : "Authentication failed. Try again or contact support if this keeps happening."}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/auth/sign-in"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-background hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:border-accent/40"
        >
          Get started
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm text-muted hover:border-accent/40 hover:text-foreground"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
