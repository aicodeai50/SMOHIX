export function PlaceholderCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="shynvo-glass rounded-2xl">
      <div className="border-b border-white/[0.06] bg-gradient-to-r from-transparent via-accent/[0.06] to-transparent px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-foreground/95">{title}</h2>
      </div>
      <div className="p-5 pt-4">{children}</div>
    </section>
  );
}
