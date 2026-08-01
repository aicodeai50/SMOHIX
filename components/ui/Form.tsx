"use client";

import { type InputHTMLAttributes, useId } from "react";

export function Input({
  label,
  hint,
  className = "",
  id: idProp,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-foreground/90">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={`w-full rounded-lg border border-white/[0.1] bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 transition-[border-color,box-shadow] duration-200 focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 ${className}`}
        {...props}
      />
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  className = "",
  id: idProp,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-foreground/90">
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        className={`w-full rounded-lg border border-white/[0.1] bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted/60 transition-[border-color,box-shadow] duration-200 focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 ${className}`}
        {...props}
      />
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
