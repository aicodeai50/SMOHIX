import type { Metadata } from "next";
import Link from "next/link";

import { marketingCta } from "@/lib/marketing-copy";

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
    <div className="shynvo-glass rounded-3xl p-8 md:p-10">
      <h1 className="shynvo-headline text-lg font-semibold tracking-tight md:text-xl">
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
          className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_24px_-8px_rgba(94,225,255,0.4)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_32px_-6px_rgba(94,225,255,0.5)]"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] px-5 text-sm font-medium text-foreground transition-[border-color,box-shadow] hover:border-accent/35 hover:shadow-[0_0_20px_-10px_rgba(94,225,255,0.2)]"
        >
          {marketingCta.footerSignup}
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/[0.08] px-5 text-sm text-muted transition-[border-color,color] hover:border-accent/30 hover:text-foreground"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
