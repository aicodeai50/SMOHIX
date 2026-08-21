import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
};

function ResetFallback() {
  return (
    <div
      className="smohix-surface h-64 animate-pulse rounded-[var(--la-radius-lg)]"
      aria-hidden
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
