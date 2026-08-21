import type { ReactNode } from "react";

export type ExecutionBadgeTone = "neutral" | "info" | "warn" | "success" | "danger" | "muted";

const toneClass: Record<ExecutionBadgeTone, string> = {
  neutral: "border-white/[0.12] bg-white/[0.04] text-foreground/85",
  info: "border-accent/30 bg-accent/[0.1] text-accent-muted",
  warn: "border-amber-400/35 bg-amber-500/[0.12] text-amber-100/95",
  success: "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-100/95",
  danger: "border-red-400/35 bg-red-500/[0.12] text-red-100/95",
  muted: "border-white/[0.08] bg-white/[0.02] text-muted",
};

export function ExecutionBadge({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: ExecutionBadgeTone;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
