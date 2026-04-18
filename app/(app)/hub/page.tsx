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
        eyebrow="Shynvo"
        title="Platform"
        description="Open any module below. Core flows work without billing; connect Supabase and Lemon Squeezy when you are ready for accounts, subscriptions, and persistence."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CONSOLE_MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="shynvo-glass group flex flex-col rounded-2xl p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_0_40px_-14px_rgba(94,225,255,0.2)]"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl leading-none text-accent/90" aria-hidden>
                {m.icon}
              </span>
              {m.live ? (
                <span className="rounded-md bg-success-dim px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success shadow-[0_0_12px_-4px_rgba(74,222,128,0.35)]">
                  Live
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-base font-semibold text-foreground group-hover:text-accent">
              {m.label}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">{m.description}</p>
            <span className="mt-4 text-xs font-semibold text-accent/85">Open</span>
          </Link>
        ))}
      </div>
    </>
  );
}
