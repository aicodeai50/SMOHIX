import Link from "next/link";

import type { EcosystemNode } from "@/lib/technology-content";
import { mBody, mFocusRing } from "@/lib/marketing-layout";

type EcosystemConnectionMapProps = {
  nodes: readonly EcosystemNode[];
  headingId: string;
};

/**
 * Responsive ecosystem connection illustration — SVG spine with hoverable nodes.
 * Pure CSS interactions; no client JavaScript required.
 */
export function EcosystemConnectionMap({ nodes, headingId }: EcosystemConnectionMapProps) {
  const spineHeight = nodes.length * 72;

  return (
    <div
      className="relative mx-auto max-w-2xl"
      role="img"
      aria-labelledby={headingId}
      aria-label="How Zentro ecosystem capabilities connect"
    >
      {/* Desktop: spine + alternating nodes */}
      <div className="hidden sm:block">
        <svg
          className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2"
          width="4"
          height={spineHeight}
          aria-hidden
        >
          <defs>
            <linearGradient id="tech-spine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(94,225,255,0.15)" />
              <stop offset="50%" stopColor="rgba(94,225,255,0.45)" />
              <stop offset="100%" stopColor="rgba(94,225,255,0.15)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="4" height={spineHeight} rx="2" fill="url(#tech-spine)" />
        </svg>

        <ol className="relative space-y-4">
          {nodes.map((node, index) => {
            const alignRight = index % 2 === 1;
            return (
              <li
                key={node.id}
                className={`flex items-center ${alignRight ? "justify-end" : "justify-start"}`}
              >
                <NodeCard node={node} align={alignRight ? "right" : "left"} />
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile: vertical stack */}
      <ol className="space-y-3 sm:hidden">
        {nodes.map((node) => (
          <li key={node.id}>
            <NodeCard node={node} align="center" />
          </li>
        ))}
      </ol>
    </div>
  );
}

function NodeCard({
  node,
  align,
}: {
  node: EcosystemNode;
  align: "left" | "right" | "center";
}) {
  const widthClass =
    align === "center" ? "w-full" : "w-[calc(50%-1.5rem)] max-w-xs";
  const cardClass = [
    widthClass,
    "rounded-xl border border-white/[0.1] bg-gradient-to-br from-white/[0.05] to-transparent p-4",
    "transition-[border-color,box-shadow,transform] duration-300",
    "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_0_28px_-10px_rgba(94,225,255,0.3)]",
    "motion-reduce:transition-none motion-reduce:hover:transform-none",
    mFocusRing,
  ].join(" ");

  const content = (
    <>
      <p className="text-sm font-semibold tracking-tight text-foreground">{node.label}</p>
      <p className={`mt-1 text-xs ${mBody}`}>{node.description}</p>
    </>
  );

  if (node.href) {
    return (
      <Link href={node.href} className={`group block ${cardClass}`}>
        <span className="transition-colors group-hover:text-accent">{content}</span>
      </Link>
    );
  }

  return <article className={cardClass}>{content}</article>;
}
