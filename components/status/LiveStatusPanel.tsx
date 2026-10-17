"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { statusLabel, statusToneClass } from "@/lib/status/presentation";
import type { ProductStatusResult } from "@/lib/status/types";
import { mBody, mBodySm } from "@/lib/marketing-layout";

function readSnapshot(body: unknown): ProductStatusResult[] {
  const products = (body as { products?: ProductStatusResult[] } | null)?.products;
  if (!Array.isArray(products) || products.length > 64 || !products.every(item => item &&
    typeof item.productId === "string" && typeof item.label === "string" &&
    typeof item.detail === "string" && typeof item.href === "string" &&
    item.href.startsWith("/") && !item.href.startsWith("//") &&
    ["operational", "degraded", "unavailable", "unknown", "prototype", "planned"].includes(item.status) &&
    Number.isFinite(Date.parse(item.lastChecked)))) throw new Error("invalid_status");
  return products;
}

export function LiveStatusPanel({ initialStatuses }: { initialStatuses: ProductStatusResult[] }) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [mode, setMode] = useState("Connecting to live updates");
  useEffect(() => {
    let disposed = false;
    let source: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | null = null;
    let live = false;
    let lastSnapshotAt = 0;
    const poll = async () => {
      if (disposed || request || document.visibilityState !== "visible") return;
      const controller = new AbortController(); request = controller;
      try {
        const response = await fetch("/api/status/products", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]) });
        if (!response.ok) throw new Error("unavailable");
        const products = readSnapshot(await response.json());
        if (!disposed && !controller.signal.aborted) {
          setStatuses(products);
          setMode("Automatic service updates");
        }
      } catch { if (!disposed && !controller.signal.aborted) setMode("Updates delayed · showing the last received checks"); }
      finally { if (request === controller) request = null; }
    };
    const reconnect = (delay: number) => {
      source?.close(); source = null; live = false;
      clearTimeout(retry);
      if (!disposed && document.visibilityState === "visible") retry = setTimeout(connect, delay);
    };
    const connect = () => {
      if (disposed || document.visibilityState !== "visible") return;
      if (typeof EventSource === "undefined") { void poll(); return; }
      source = new EventSource("/api/status/products/stream");
      const current = source;
      current.addEventListener("snapshot", event => {
        if (disposed || source !== current) return;
        try { setStatuses(readSnapshot(JSON.parse((event as MessageEvent).data))); live = true; lastSnapshotAt = Date.now(); setMode("Live service updates"); }
        catch { reconnect(30_000); void poll(); }
      });
      current.addEventListener("reconnect", () => { if (!disposed && source === current) reconnect(1_000); });
      const unavailable = () => { if (disposed || source !== current) return; reconnect(30_000); void poll(); };
      current.addEventListener("unavailable", unavailable);
      current.onerror = unavailable;
    };
    const visibility = () => {
      source?.close(); source = null; live = false;
      clearTimeout(retry); request?.abort();
      if (document.visibilityState === "visible") { connect(); void poll(); }
      else setMode("Updates paused while this page is hidden");
    };
    const timer = setInterval(() => { if (!live || Date.now() - lastSnapshotAt > 45_000) void poll(); }, 30_000);
    document.addEventListener("visibilitychange", visibility);
    connect();
    return () => { disposed = true; source?.close(); clearInterval(timer); clearTimeout(retry); request?.abort(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return <>
    <p role="status" className="mb-4 text-sm text-muted">{mode}</p>
    <ul className="grid gap-4 sm:grid-cols-2">
      {statuses.map(item => <li key={item.productId} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={item.href} className="font-semibold text-foreground hover:text-accent">{item.label}</Link>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusToneClass(item.status)}`}>{statusLabel(item.status)}</span>
        </div>
        <p className={`mt-2 ${mBody}`}>{item.detail}</p>
        <p className={`mt-2 ${mBodySm}`}>Status updated: <time dateTime={item.lastChecked}>{new Date(item.lastChecked).toISOString().replace("T", " ").slice(0, 19)} UTC</time></p>
      </li>)}
    </ul>
  </>;
}
