import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeaderNav } from "@/components/auth/AuthHeaderNav";
import { IntelligenceField } from "@/components/architecture";
import { Logo } from "@/components/site/Logo";
import { NOINDEX_ROBOTS } from "@/lib/metadata";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="smohix-spatial-grid relative flex min-h-screen flex-col bg-background">
      <IntelligenceField className="opacity-35" animate={false} />
      <header className="relative z-[1] flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-6">
        <Link href="/" className="min-w-0 shrink text-foreground no-underline">
          <Logo />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <AuthHeaderNav />
        </div>
      </header>
      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
