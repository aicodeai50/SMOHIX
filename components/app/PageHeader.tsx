import type { ReactNode } from "react";

import { appBody, appDisplay, appSignal } from "@/lib/app-typography";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className = "",
}: {
  title: string;
  description?: string;
  /** Short label above the title (e.g. module area). */
  eyebrow?: string;
  /** Primary page actions (right side on desktop). */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`smohix-oe-page-header ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className={`${appSignal} text-accent/85`}>{eyebrow}</p> : null}
          <h1 className={`${appDisplay} max-w-4xl ${eyebrow ? "mt-3" : ""}`}>{title}</h1>
          {description ? (
            <p className={`mt-4 max-w-2xl text-pretty text-[1rem] leading-relaxed text-muted ${appBody}`}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

/** Authenticated page header alias — same primitive, clearer product naming. */
export function AppPageHeader(props: Parameters<typeof PageHeader>[0]) {
  return <PageHeader {...props} />;
}
