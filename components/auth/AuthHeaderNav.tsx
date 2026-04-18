"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkClass =
  "rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-elevated/80 hover:text-foreground";

export function AuthHeaderNav() {
  const pathname = usePathname();
  const onSignIn = pathname.startsWith("/auth/sign-in");
  const onSignUp = pathname.startsWith("/auth/sign-up");

  return (
    <nav
      className="flex shrink-0 items-center gap-1 sm:gap-2"
      aria-label="Account"
    >
      <Link
        href="/auth/sign-in"
        className={`${linkClass} ${onSignIn ? "text-foreground" : "text-muted"}`}
        aria-current={onSignIn ? "page" : undefined}
      >
        Sign in
      </Link>
      <Link
        href="/auth/sign-up"
        className={`${linkClass} font-medium ${onSignUp ? "bg-accent-dim text-accent" : "text-accent"}`}
        aria-current={onSignUp ? "page" : undefined}
      >
        Get started
      </Link>
    </nav>
  );
}
