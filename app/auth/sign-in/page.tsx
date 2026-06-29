import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
};

function SignInFallback() {
  return (
    <div
      className="zentro-glass-subtle h-64 animate-pulse rounded-3xl"
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
