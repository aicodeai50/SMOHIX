import { type HTMLAttributes, type ReactNode } from "react";

export type BadgeVariant =
  | "live"
  | "preview"
  | "planned"
  | "neutral"
  | "trust-current"
  | "trust-progress"
  | "trust-planned";

const variantClasses: Record<BadgeVariant, string> = {
  live: "border-accent/30 bg-accent-dim text-accent",
  preview: "border-warning/30 bg-warning-dim text-warning",
  planned: "border-white/[0.12] bg-white/[0.03] text-muted",
  neutral: "border-white/[0.12] bg-white/[0.03] text-muted",
  "trust-current": "border-accent/25 bg-accent-dim text-accent",
  "trust-progress": "border-warning/25 bg-warning-dim text-warning",
  "trust-planned": "border-white/[0.12] bg-white/[0.02] text-muted",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-[10px]",
} as const;

export function Badge({
  variant = "neutral",
  size = "sm",
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: keyof typeof sizeClasses;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
