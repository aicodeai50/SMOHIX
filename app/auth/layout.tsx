import Link from "next/link";

import { AuthHeaderNav } from "@/components/auth/AuthHeaderNav";
import { AuthHistoryNav } from "@/components/auth/AuthHistoryNav";
import { Logo } from "@/components/site/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <Link href="/" className="min-w-0 shrink text-foreground no-underline">
          <Logo />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <AuthHistoryNav />
          <AuthHeaderNav />
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
