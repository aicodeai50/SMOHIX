export function PageHeader({
  title,
  description,
  className = "mb-8",
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
      ) : null}
    </div>
  );
}
