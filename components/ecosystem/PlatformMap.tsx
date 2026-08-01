"use client";

import Link from "next/link";
import { useCallback, useId, useState } from "react";

import { AppIcon } from "@/components/icons/AppIcon";
import {
  getPlatformEdges,
  maturityLabel,
  PLATFORM_LAYOUT,
  PLATFORM_NODES,
  type PlatformNodeId,
} from "@/lib/ecosystem-graph";

function nodeActive(
  id: PlatformNodeId,
  hovered: PlatformNodeId | null,
): boolean {
  if (!hovered) return false;
  if (id === hovered) return true;
  const node = PLATFORM_NODES.find((n) => n.id === hovered);
  return node?.connections.includes(id) ?? false;
}

function edgeActive(
  from: PlatformNodeId,
  to: PlatformNodeId,
  hovered: PlatformNodeId | null,
): boolean {
  if (!hovered) return false;
  return from === hovered || to === hovered;
}

export function PlatformMap() {
  const [hovered, setHovered] = useState<PlatformNodeId | null>(null);
  const mapId = useId().replace(/:/g, "");
  const edges = getPlatformEdges();

  const onEnter = useCallback((id: PlatformNodeId) => setHovered(id), []);
  const onLeave = useCallback(() => setHovered(null), []);

  const tiers = [0, 1, 2, 3, 4].map((tier) =>
    PLATFORM_NODES.filter((n) => n.tier === tier),
  );

  return (
    <div className="relative mt-10">
      {/* Desktop: SVG map with hover graph */}
      <div className="hidden md:block">
        <div className="relative mx-auto aspect-[5/4] max-w-3xl">
          <svg
            viewBox="0 0 100 88"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${mapId}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(99,102,241,0.15)" />
                <stop offset="50%" stopColor="rgba(99,102,241,0.55)" />
                <stop offset="100%" stopColor="rgba(16,185,129,0.35)" />
              </linearGradient>
            </defs>
            {edges.map(({ from, to }) => {
              const a = PLATFORM_LAYOUT[from];
              const b = PLATFORM_LAYOUT[to];
              const active = edgeActive(from, to, hovered);
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={active ? `url(#${mapId}-line)` : "rgba(255,255,255,0.08)"}
                  strokeWidth={active ? 0.45 : 0.25}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {PLATFORM_NODES.map((node) => {
            const { x, y } = PLATFORM_LAYOUT[node.id];
            const active = nodeActive(node.id, hovered);
            return (
              <Link
                key={node.id}
                href={node.href}
                onMouseEnter={() => onEnter(node.id)}
                onMouseLeave={onLeave}
                onFocus={() => onEnter(node.id)}
                onBlur={onLeave}
                className={`absolute flex w-[7.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-xl border px-2 py-2.5 text-center transition-all duration-300 sm:w-[8.5rem] ${
                  active
                    ? "z-10 scale-105 border-primary-muted/50 bg-primary-dim shadow-[0_0_32px_-8px_rgba(99,102,241,0.45)]"
                    : hovered
                      ? "border-white/[0.06] bg-white/[0.02] opacity-45"
                      : "border-white/[0.1] bg-white/[0.04] hover:border-primary-muted/35"
                }`}
                style={{
                  left: `${x}%`,
                  top: `${(y / 88) * 100}%`,
                }}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    active ? "bg-accent/20" : "bg-white/[0.06]"
                  }`}
                >
                  <AppIcon
                    name={node.icon}
                    size={18}
                    className={active ? "text-accent" : "text-primary-muted"}
                    aria-hidden
                  />
                </div>
                <span className="mt-1.5 text-[11px] font-semibold leading-tight text-foreground">
                  {node.label}
                </span>
                <span className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">
                  {maturityLabel(node.maturity)}
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Hover a capability to see how it connects across the platform.
        </p>
      </div>

      {/* Mobile: tiered list — no heavy SVG interaction */}
      <div className="space-y-6 md:hidden" role="list" aria-label="Platform capabilities">
        {tiers.map(
          (row) =>
            row.length > 0 && (
              <div key={row[0]?.tier} className="flex flex-wrap justify-center gap-3">
                {row.map((node) => (
                  <Link
                    key={node.id}
                    href={node.href}
                    role="listitem"
                    className="flex min-w-[8rem] flex-col items-center rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-3 text-center transition-colors hover:border-accent/35"
                  >
                    <AppIcon name={node.icon} size={20} className="text-primary-muted" />
                    <span className="mt-2 text-xs font-semibold text-foreground">{node.label}</span>
                    <span className="mt-1 text-[10px] text-muted">{node.shortDescription}</span>
                  </Link>
                ))}
              </div>
            ),
        )}
      </div>
    </div>
  );
}
