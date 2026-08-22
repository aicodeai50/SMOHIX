import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeaderNav } from "@/components/auth/AuthHeaderNav";
import { IntelligenceField, SmohixHorizon } from "@/components/architecture";
import { Logo } from "@/components/site/Logo";
import { NOINDEX_ROBOTS } from "@/lib/metadata";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="smohix-auth-portal smohix-spatial-grid relative min-h-screen bg-background">
      <IntelligenceField className="opacity-[0.28] md:opacity-[0.32]" animate={false} />
      <header className="relative z-[2] flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-6 lg:col-span-2">
        <Link href="/" className="min-w-0 shrink text-foreground no-underline">
          <Logo />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <AuthHeaderNav />
        </div>
      </header>

      <aside className="smohix-auth-portal__context relative z-[1] hidden lg:block">
        <p className="smohix-signal-meta text-accent/85">Entry portal</p>
        <h1 className="smohix-headline mt-4 text-3xl font-bold tracking-tight">
          Enter {SITE_BRAND_NAME}
        </h1>
        <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted">
          Sign in to your operating workspace — incidents, approvals, automations, and Copilot on
          one architectural surface.
        </p>
        <div className="mt-8 max-w-sm">
          <SmohixHorizon />
          <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-muted/65">
            AUTH · ORG · RBAC · AUDIT
          </p>
        </div>
      </aside>

      <div className="smohix-auth-portal__form relative z-[1] flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="smohix-auth-portal__form-plane">{children}</div>
      </div>
    </div>
  );
}
