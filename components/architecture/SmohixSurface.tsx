import type { ReactNode } from "react";

type SurfaceTone = "dormant" | "aware" | "active" | "attention" | "critical" | "verified";

const toneClass: Record<SurfaceTone, string> = {
  dormant: "smohix-surface",
  aware: "smohix-surface smohix-surface--aware",
  active: "smohix-surface smohix-surface--active",
  attention: "smohix-surface smohix-surface--attention",
  critical: "smohix-surface smohix-surface--critical",
  verified: "smohix-surface smohix-surface--verified",
};

/**
 * Living Architecture intelligent surface — architectural panel, not a generic SaaS card.
 */
export function SmohixSurface({
  children,
  tone = "aware",
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  tone?: SurfaceTone;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={`${toneClass[tone]} ${className}`.trim()}>{children}</Tag>;
}
