"use client";

import { useEffect, type ReactNode } from "react";
import { AppIcon } from "@/components/icons/AppIcon";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
};

const variantBorder = {
  default: "border-white/[0.12]",
  success: "border-success/40",
  error: "border-danger/40",
};

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface-elevated/95 p-4 shadow-xl backdrop-blur-xl ${variantBorder[toast.variant ?? "default"]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs text-muted">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-muted hover:bg-white/[0.06] hover:text-foreground"
        aria-label="Dismiss"
      >
        <AppIcon name="close" size={14} />
      </button>
    </div>
  );
}

export function ToastViewport({ children }: { children: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2"
    >
      {children}
    </div>
  );
}
