import Link from "next/link";

import { mSystemMeta } from "@/lib/marketing-layout";

const LINKS = [
  { href: "/security", label: "Security", role: "Controls & boundaries" },
  { href: "/trust", label: "Trust", role: "Evidence & assurance" },
  { href: "/status", label: "Status", role: "Operational availability" },
] as const;

/** Institutional navigation among Security · Trust · Status. */
export function AssuranceRail({ active }: { active: "security" | "trust" | "status" }) {
  return (
    <nav className="smohix-assurance-rail" aria-label="Assurance surfaces">
      <p className={`${mSystemMeta} text-muted/65`}>Smohix assurance</p>
      <ul className="smohix-assurance-rail__list">
        {LINKS.map((item) => {
          const isActive =
            (active === "security" && item.href === "/security") ||
            (active === "trust" && item.href === "/trust") ||
            (active === "status" && item.href === "/status");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`smohix-assurance-rail__item${isActive ? " smohix-assurance-rail__item--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="smohix-assurance-rail__label">{item.label}</span>
                <span className="smohix-assurance-rail__role">{item.role}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
