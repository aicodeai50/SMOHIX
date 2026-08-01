import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/pilots", label: "Pilots" },
] as const;

export function AdminNav({ active }: { active: "dashboard" | "leads" | "pilots" }) {
  return (
    <nav aria-label="Admin navigation" className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-4">
      {LINKS.map((link) => {
        const key = link.href === "/admin" ? "dashboard" : link.href.includes("pilots") ? "pilots" : "leads";
        const isActive = key === active;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent/20 text-accent"
                : "text-muted hover:bg-white/[0.04] hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
