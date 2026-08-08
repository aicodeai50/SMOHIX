export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="smohix-glass rounded-2xl p-8 md:p-10">
      <h1 className="smohix-headline text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
