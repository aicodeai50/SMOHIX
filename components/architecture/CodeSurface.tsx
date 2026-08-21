import type { ReactNode } from "react";

/**
 * Smohix code/data surface — engineered mono blocks for APIs, keys, receipts.
 * Not a fake terminal.
 */
export function CodeSurface({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`smohix-code-surface min-w-0 max-w-full ${className}`.trim()}>
      {label ? (
        <div className="smohix-code-surface__meta">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/80">{label}</span>
        </div>
      ) : null}
      <div className="smohix-code-surface__body">{children}</div>
    </div>
  );
}
