import type { ReactNode } from "react";

/** Compact system label for instrument rails and metadata rows. */
export function SystemLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-muted ${className}`.trim()}
    >
      {children}
    </span>
  );
}
