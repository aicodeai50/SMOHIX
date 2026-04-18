import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
};

function SignInFallback() {
  return (
    <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface-elevated" aria-hidden />
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
