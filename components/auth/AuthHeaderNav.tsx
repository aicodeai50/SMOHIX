"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { marketingCta } from "@/lib/marketing-copy";

const linkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-surface-elevated/80";

/** Only on sign-in: link to sign-up. Sign-up page uses the form footer for the reverse. */
export function AuthHeaderNav() {
  const pathname = usePathname();
  if (!pathname.startsWith("/auth/sign-in")) return null;

  return (
    <Link href="/auth/sign-up" className={linkClass}>
      {marketingCta.signUp}
    </Link>
  );
}
