import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
};

function SignInFallback() {
  return (
    <div
      className="smohix-surface h-64 animate-pulse rounded-[var(--la-radius-lg)]"
      aria-hidden
    />
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
