import type { ReactNode } from "react";

/**
 * Smohix code/data surface — engineered mono blocks for APIs, keys, receipts.
 * Not a fake terminal or IDE.
 */
export function CodeSurface({
  children,
  className = "",
  label,
  context,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  /** Optional secondary context (e.g. language or route family). */
  context?: string;
}) {
  return (
    <div className={`smohix-code-surface min-w-0 max-w-full ${className}`.trim()}>
      {label || context ? (
        <div className="smohix-code-surface__meta">
          {label ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/80">{label}</span>
          ) : null}
          {context ? (
            <span className="font-mono text-[10px] tracking-[0.08em] text-muted/55">{context}</span>
          ) : null}
        </div>
      ) : null}
      <div className="smohix-code-surface__body">{children}</div>
    </div>
  );
}
