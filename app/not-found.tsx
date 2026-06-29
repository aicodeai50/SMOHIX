import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-4 py-16">
      <div className="zentro-glass w-full max-w-md rounded-3xl p-8 text-center md:p-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">404</p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-foreground md:text-xl">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted">
          The link may be wrong, or this page was moved. Try the home page or open the console from
          the hub.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Home
          </Link>
          <Link
            href="/hub"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.1] px-5 text-sm text-muted transition-colors hover:border-white/[0.18] hover:text-foreground"
          >
            Console hub
          </Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.1] px-5 text-sm text-muted transition-colors hover:border-white/[0.18] hover:text-foreground"
          >
            Account
          </Link>
        </div>
      </div>
    </div>
  );
}
