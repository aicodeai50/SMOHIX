import { appPanelTitle } from "@/lib/app-typography";

export function ConsolePanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="zentro-glass rounded-2xl">
      <div className="border-b border-white/[0.06] bg-gradient-to-r from-transparent via-accent/[0.06] to-transparent px-5 py-4">
        <h2 className={`${appPanelTitle} text-foreground/95`}>{title}</h2>
      </div>
      <div className="p-5 pt-4">{children}</div>
    </section>
  );
}
