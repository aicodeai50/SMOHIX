export function PageHeader({
  title,
  description,
  eyebrow,
  className = "mb-8",
}: {
  title: string;
  description?: string;
  /** Short label above the title (e.g. module area). */
  eyebrow?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/85">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={`shynvo-headline max-w-4xl text-2xl font-semibold tracking-tight md:text-[1.85rem] md:leading-snug ${eyebrow ? "mt-2" : ""}`}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-pretty text-[0.9375rem] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </header>
  );
}
