import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className = "mb-8",
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
    <header className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent/80">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={`smohix-headline max-w-4xl text-2xl font-semibold tracking-tight md:text-[1.85rem] md:leading-snug ${eyebrow ? "mt-2" : ""}`}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-pretty text-[0.9375rem] leading-relaxed text-muted">
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
