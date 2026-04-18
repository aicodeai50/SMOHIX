"use client";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-full bg-background px-4 py-16 text-center text-foreground antialiased">
        <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          A client or root layout error stopped this page from rendering. You can try again or
          return to the home page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.12] px-5 text-sm text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
          >
            Home
          </a>
        </div>
      </body>
    </html>
  );
}
