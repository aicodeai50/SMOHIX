import { type ReactNode } from "react";

import { AppIcon } from "@/components/icons/AppIcon";

type AlertVariant = "info" | "success" | "warning" | "neutral";

const variantClasses: Record<AlertVariant, string> = {
  info: "border-accent/25 bg-accent-dim/40 text-foreground",
  success: "border-success/25 bg-success-dim/40 text-foreground",
  warning: "border-warning/25 bg-warning-dim/40 text-foreground",
  neutral: "border-white/[0.1] bg-white/[0.03] text-foreground",
};

const iconNames = {
  info: "circleDot",
  success: "check",
  warning: "alertTriangle",
  neutral: "circle",
} as const;

export function Alert({
  variant = "neutral",
  title,
  children,
  className = "",
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`rounded-xl border px-4 py-3 ${variantClasses[variant]} ${className}`}
    >
      <div className="flex gap-3">
        <AppIcon
          name={iconNames[variant]}
          size={18}
          className="mt-0.5 shrink-0 text-muted"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
          <div className={`text-sm leading-relaxed text-muted ${title ? "mt-1" : ""}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
