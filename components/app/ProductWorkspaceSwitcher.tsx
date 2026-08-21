"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { appMeta } from "@/lib/app-typography";
import {
  FLAGSHIP_PRODUCTS,
  SMOHIX_WORKSPACE_URLS,
} from "@/lib/ecosystem-workspaces";

type SwitcherItem = {
  id: string;
  name: string;
  detail: string;
  href: string;
  external?: boolean;
  status: "live" | "preview" | "planned";
  current?: boolean;
};

const ITEMS: SwitcherItem[] = [
  {
    id: "smohix-platform",
    name: "Smohix Platform",
    detail: "Operations workspace",
    href: "/hub",
    status: "live",
    current: true,
  },
  {
    id: "smohix-ai",
    name: "Smohix AI",
    detail: "Flagship AI workspace",
    href: SMOHIX_WORKSPACE_URLS.ai,
    external: true,
    status: "live",
  },
  {
    id: "smohix-assistant",
    name: "Smohix Assistant",
    detail: FLAGSHIP_PRODUCTS.find((p) => p.id === "smohix-assistant")?.description ?? "Personal workspace",
    href: SMOHIX_WORKSPACE_URLS.assistant,
    external: true,
    status: "preview",
  },
  {
    id: "private-ai",
    name: "Smohix PRI",
    detail: FLAGSHIP_PRODUCTS.find((p) => p.id === "private-ai")?.description ?? "Private AI",
    href: SMOHIX_WORKSPACE_URLS.privateAi,
    external: true,
    status: "preview",
  },
];

function statusClass(status: SwitcherItem["status"]): string {
  if (status === "live") return "bg-emerald-500/16 text-emerald-300/95";
  if (status === "preview") return "bg-amber-400/14 text-amber-200/95";
  return "bg-white/[0.08] text-muted";
}

export function ProductWorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const node = event.target as Node | null;
      if (!node || rootRef.current?.contains(node)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = ITEMS.find((i) => i.current) ?? ITEMS[0]!;

  return (
    <div ref={rootRef} className={`relative ${compact ? "" : "w-full"}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-2.5 py-2 text-left transition-colors hover:border-accent/35 hover:bg-white/[0.05] ${appMeta}`}
      >
        <span className="min-w-0">
          <span className="block truncate text-[12px] font-semibold text-foreground/95">
            {current.name}
          </span>
          <span className="block truncate text-[10px] text-muted">{current.detail}</span>
        </span>
        <span className="shrink-0 rounded-md bg-emerald-500/16 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300/95">
          Live
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 space-y-0.5 rounded-xl border border-white/[0.1] bg-[rgba(10,12,18,0.98)] p-1.5 shadow-[0_18px_48px_-22px_rgba(0,0,0,0.9)] backdrop-blur-xl"
        >
          {ITEMS.map((item) => {
            const className = `flex w-full items-start justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
              item.current ? "bg-accent/[0.08]" : "hover:bg-white/[0.05]"
            }`;
            const body = (
              <>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-foreground/95">
                    {item.name}
                    {item.external ? " ↗" : ""}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-[10px] leading-snug text-muted">
                    {item.detail}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${statusClass(item.status)}`}
                >
                  {item.status}
                </span>
              </>
            );
            return (
              <li key={item.id} role="option" aria-selected={Boolean(item.current)}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    {body}
                  </a>
                ) : (
                  <Link href={item.href} className={className} onClick={() => setOpen(false)}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
