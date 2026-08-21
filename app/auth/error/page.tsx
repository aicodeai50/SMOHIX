import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";

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
    <AuthCard
      title="Something went wrong"
      subtitle={
        reason === "callback"
          ? "We could not complete sign-in from your link. The link may have expired — try signing in again."
          : "Authentication failed. Try again or contact support if this keeps happening."
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/auth/sign-in"
          className="inline-flex h-11 min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 min-h-11 items-center justify-center rounded-lg border border-white/[0.1] px-5 text-sm text-muted transition-colors hover:border-white/[0.18] hover:text-foreground"
        >
          Home
        </Link>
      </div>
    </AuthCard>
  );
}
