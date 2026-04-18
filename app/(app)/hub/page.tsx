import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/PageHeader";
import { CONSOLE_MODULES } from "@/lib/console-nav";

export const metadata: Metadata = {
  title: "Platform",
  description: "Shynvo console — modules and shortcuts.",
};

export const dynamic = "force-dynamic";

export default function HubPage() {
  return (
    <>
      <PageHeader
        title="Platform"
        description="Everything here is clickable — no Supabase or Lemon required for Copilot, API key demos, and navigation. Connect billing and auth when you are ready."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CONSOLE_MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group flex flex-col rounded-xl border border-border bg-surface/80 p-4 shadow-sm transition-colors hover:border-accent/50 hover:bg-surface-elevated/60"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl leading-none text-accent/90" aria-hidden>
                {m.icon}
              </span>
              {m.live ? (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400/90">
                  Live
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground group-hover:text-accent">
              {m.label}
            </h2>
            <p className="mt-1 text-xs text-muted">{m.description}</p>
            <span className="mt-4 text-xs font-medium text-accent/80">Open →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
