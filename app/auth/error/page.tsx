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
    <div className="zentro-glass rounded-3xl p-8 md:p-10">
      <h1 className="zentro-headline text-lg font-semibold tracking-tight md:text-xl">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted">
        {reason === "callback"
          ? "We could not complete sign-in from your link. The link may have expired — try signing in again."
          : "Authentication failed. Try again or contact support if this keeps happening."}
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/auth/sign-in"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Account
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.1] px-5 text-sm text-muted transition-colors hover:border-white/[0.18] hover:text-foreground"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
