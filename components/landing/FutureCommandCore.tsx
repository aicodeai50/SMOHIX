"use client";

import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { SmohixHqMark } from "@/components/brand/hq/SmohixHqMark";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon, type AppIconName } from "@/components/icons/AppIcon";
import { getCommandSnapshot, commandAvailability } from "@/lib/hq/command-status";
import type { ProductStatusResult } from "@/lib/status/types";

export type CommandProduct = { id: string; name: string; href: string };
const SERVICE_ICONS: Record<string, AppIconName> = {
  "smohix-platform": "layoutDashboard", "smohix-ai": "bot",
  "smohix-assistant": "workflow", "private-ai": "shieldCheck",
};

export function FutureCommandCore({ products }: { products: CommandProduct[] }) {
  const [statuses, setStatuses] = useState<ProductStatusResult[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receivedAt, setReceivedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [paused, setPaused] = useState(false);
  const busy = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const abort = useRef<AbortController | null>(null);

  const checkServices = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch("/api/status/products", {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(response.status === 429
        ? "Checks are busy. Please wait before refreshing."
        : "Service checks are temporarily unavailable.");
      const body = await response.json() as { products?: ProductStatusResult[] };
      if (!Array.isArray(body.products) || !body.products.every(result => result &&
        typeof result.productId === "string" && typeof result.lastChecked === "string" &&
        Number.isFinite(Date.parse(result.lastChecked)) &&
        ["operational", "degraded", "unavailable", "unknown", "prototype", "planned"].includes(result.status))) {
        throw new Error("Could not read service checks.");
      }
      const timestamp = Date.now();
      setStatuses(body.products);
      setReceivedAt(timestamp);
      setNow(timestamp);
      setError(null);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error && err.name !== "TimeoutError"
        ? err.message : "Service checks timed out. Refresh to try again.");
    } finally {
      if (abort.current === controller) {
        busy.current = false;
        if (!controller.signal.aborted) setPending(false);
      }
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      const isPaused = document.visibilityState !== "visible";
      setPaused(isPaused);
      setNow(Date.now());
      if (visible.current && !isPaused) void checkServices();
    };
    const observer = new IntersectionObserver(entries => {
      visible.current = entries[0]?.isIntersecting ?? false;
      if (visible.current) refresh();
    });
    if (panel.current) observer.observe(panel.current);
    const timer = window.setInterval(refresh, 60_000);
    const clock = window.setInterval(() => {
      if (document.visibilityState === "visible") setNow(Date.now());
    }, 15_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      window.clearInterval(clock);
      document.removeEventListener("visibilitychange", refresh);
      abort.current?.abort();
      busy.current = false;
    };
  }, [checkServices]);

  const snapshot = getCommandSnapshot(products.map(product => product.id), statuses,
    { now, receivedAt, error: Boolean(error), paused });
  const { results, reachable, attention, verified, feed } = snapshot;

  return (
    <div ref={panel} className="smohix-live-command hq-command-panel">
      <div className="smohix-live-command__frame hq-command">
        <header className="hq-command__top">
          <div className="hq-command__identity">
            <span className="hq-command__symbol" aria-hidden><SmohixHqMark size={23} micro decorative tone="mono" /></span>
            <div>
              <p className="hq-command__eyebrow">Smohix HQ / Connected ecosystem</p>
              <h2 className="hq-command__title">Operational command</h2>
            </div>
          </div>
          <span className="hq-command__feed" data-feed={feed}>
            <span className="hq-command__live-dot" aria-hidden />
            {feed === "live" ? "Live" : feed === "paused" ? "Paused" : feed === "stale" ? "Delayed" : "Connecting"}
          </span>
        </header>

        <div className="hq-command__body">
          <div className="hq-command__summary">
            <div className="hq-command__dial" role="img" aria-label={receivedAt === null ? "Waiting for service checks" : `${reachable} of ${products.length} monitored endpoints reachable`}>
              <svg viewBox="0 0 160 160" aria-hidden>
                <circle className="hq-command__dial-guide" cx="80" cy="80" r="72" />
                <circle className="hq-command__dial-inner" cx="80" cy="80" r="51" />
                {Array.from({ length: 48 }, (_, index) => <line key={index}
                  className="hq-command__dial-tick" x1="80" y1="3" x2="80" y2={index % 4 === 0 ? "7" : "5"}
                  transform={`rotate(${index * 7.5} 80 80)`} />)}
                {results.map((result, index) => <circle key={products[index].id}
                  className="hq-command__dial-segment" data-status={result?.status ?? "unknown"}
                  cx="80" cy="80" r="62" pathLength="100"
                  strokeDasharray={`${100 / products.length - 3} ${100 - (100 / products.length - 3)}`}
                  transform={`rotate(${-90 + index * 360 / products.length} 80 80)`} />)}
              </svg>
              <div className="hq-command__orbit" aria-hidden>
                {products.map((product, index) => <span key={product.id}
                  className="hq-command__orbit-node" data-status={results[index]?.status ?? "unknown"}
                  style={{ transform: `rotate(${index * 360 / products.length + 45}deg) translateY(calc(var(--command-orbit-radius) * -1)) rotate(${-index * 360 / products.length - 45}deg)` }}>
                  <AppIcon name={SERVICE_ICONS[product.id] ?? "server"} size={13} />
                </span>)}
              </div>
              <div className="hq-command__dial-value"><strong>{receivedAt === null ? "—" : reachable}<small> / {products.length}</small></strong><span>Reachable</span></div>
            </div>
            <div className="hq-command__summary-copy">
            <p className="hq-command__eyebrow">Endpoint availability</p>
            <p className="hq-command__summary-title">
              {verified === 0 ? "Establishing service visibility" : attention > 0
                ? `${attention} ${attention === 1 ? "service needs" : "services need"} attention`
                : reachable === products.length ? "All monitored endpoints reachable" : "Some endpoints are not verified"}
            </p>
            <dl className="hq-command__metrics" aria-label="Public service check results">
              <div><dt>Attention</dt><dd>{receivedAt === null ? "—" : attention}</dd></div>
              <div><dt>Verified</dt><dd>{receivedAt === null ? "—" : verified}<span> / {products.length}</span></dd></div>
            </dl>
            </div>
          </div>

          <div className="hq-command__list-heading">
            <p className="hq-command__eyebrow">Connected services</p>
            <button type="button" className="hq-command__check" disabled={pending} onClick={() => void checkServices()} aria-label="Refresh service checks">
              <RefreshCw size={13} className={pending ? "hq-command__refreshing" : undefined} aria-hidden />
              {pending ? "Checking" : "Refresh"}
            </button>
          </div>
          <ul className="hq-command__services">
            {products.map((product, index) => (
              <li key={product.id} data-status={results[index]?.status ?? "unknown"}>
                <Link href={product.href} className="hq-command__service-link">
                  <span className="hq-command__service-index" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
                  <span className="hq-command__service-icon"><AppIcon name={SERVICE_ICONS[product.id] ?? "server"} size={17} /></span>
                  {product.name}
                  <ArrowUpRight size={13} className="hq-command__service-arrow" aria-hidden />
                </Link>
                <span className="hq-command__service-status" data-status={results[index]?.status ?? "unknown"}>
                  <i aria-hidden />{commandAvailability(results[index]?.status)}
                </span>
              </li>
            ))}
          </ul>
          <div className="hq-command__update" role="status" aria-live="polite">
            {error ?? (receivedAt === null ? "Waiting for the first check…"
              : feed === "stale" ? "Previous results shown. Refresh for current availability."
              : snapshot.checkedAt !== null ? <><span>Last checked</span> <time dateTime={new Date(snapshot.checkedAt).toISOString()}>{new Date(snapshot.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></> : "No monitored endpoints were verified.")}
          </div>
          <p className="hq-command__status-note">Checks refresh every minute while visible. Endpoint reachability does not verify every product function.</p>
        </div>
        <footer className="hq-command__footer">
          <Link href="/status">View full status <ArrowUpRight size={14} aria-hidden /></Link>
          <Link href="/auth/sign-in?next=/hub">Open workspace <ArrowUpRight size={14} aria-hidden /></Link>
        </footer>
      </div>
    </div>
  );
}
