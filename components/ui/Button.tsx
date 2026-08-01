import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-background shadow-[0_0_24px_-8px_rgba(16,185,129,0.4)] hover:brightness-110 active:brightness-95",
  secondary:
    "border border-white/[0.12] bg-white/[0.04] text-foreground hover:border-accent/40 hover:bg-white/[0.06] active:bg-white/[0.03]",
  ghost:
    "text-muted hover:bg-white/[0.06] hover:text-foreground active:bg-white/[0.04]",
  danger: "bg-danger/90 text-white hover:bg-danger active:bg-danger/80",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 min-h-8 px-3 text-xs",
  md: "h-10 min-h-10 px-4 text-sm sm:min-h-[2.75rem]",
  lg: "h-11 min-h-11 px-5 text-sm sm:min-h-[2.75rem]",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-[transform,box-shadow,border-color,background-color,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
