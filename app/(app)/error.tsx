"use client";

import Link from "next/link";

export default function WorkspaceError({ unstable_retry, reset }: {
  error: Error & { digest?: string }; unstable_retry?: () => void; reset: () => void;
}) {
  return <section className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6" role="alert">
    <h2 className="text-lg font-semibold text-foreground">Workspace data is unavailable</h2>
    <p className="mt-2 text-sm leading-6 text-muted">We couldn’t load this workspace view. Your records may still be present. Try again, or return to the Hub.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <button type="button" onClick={() => (unstable_retry ?? reset)()} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background">Try again</button>
      <Link href="/hub" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground">Return to Hub</Link>
    </div>
  </section>;
}
