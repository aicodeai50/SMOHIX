import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
};

function ForgotFallback() {
  return (
    <div
      className="smohix-surface h-64 animate-pulse rounded-[var(--la-radius-lg)]"
      aria-hidden
    />
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
