"use client";

import {
  Activity,
  BookOpen,
  ClipboardCheck,
  Cpu,
  LayoutGrid,
  Radio,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { PRODUCT_FILM_AI_PROMPT, PRODUCT_FILM_SCENES } from "@/lib/docs/product-film";

const SLIDE_MS = 5200;

const ICON_MAP = {
  intro: Sparkles,
  signal: Radio,
  workflow: BookOpen,
  "dry-run": Activity,
  approval: ShieldCheck,
  execute: Cpu,
  audit: ScrollText,
  outro: LayoutGrid,
} as const;

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ProductFilm() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [copyOk, setCopyOk] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false,
  );

  const scene = PRODUCT_FILM_SCENES[index];
  const Icon = ICON_MAP[scene.icon];
  const progress = ((index + 1) / PRODUCT_FILM_SCENES.length) * 100;

  const tick = useCallback(() => {
    setIndex((i) => (i + 1 >= PRODUCT_FILM_SCENES.length ? 0 : i + 1));
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(tick, SLIDE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, reducedMotion, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, PRODUCT_FILM_SCENES.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(PRODUCT_FILM_AI_PROMPT);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#0a1218] via-[#060b10] to-[#030608] shadow-[0_0_60px_-20px_rgba(94,225,255,0.2)]">
      <div className="relative aspect-video w-full">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 20%, rgba(94,225,255,0.5), transparent 70%)`,
          }}
        />

        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center sm:px-12">
          <div key={scene.id} className={`max-w-2xl ${reducedMotion ? "" : "product-film-scene"}`}>
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-accent/25 bg-accent/[0.08] text-accent shadow-lg shadow-black/30 sm:size-20">
              <Icon className="size-8 sm:size-10" aria-hidden />
            </div>
            <h2 className="text-balance text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {scene.title}
            </h2>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-muted sm:text-lg">{scene.line}</p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.06]">
          <div
            className="h-full bg-accent/80 transition-[width] duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/[0.08]"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            Restart
          </button>
          <span className="text-xs text-muted">
            {index + 1} / {PRODUCT_FILM_SCENES.length} · Space to pause
          </span>
        </div>
        <button
          type="button"
          onClick={copyPrompt}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/15"
        >
          <ClipboardCheck className="size-3.5" aria-hidden />
          {copyOk ? "Copied prompt" : "Copy AI video prompt"}
        </button>
      </div>

      <p className="border-t border-white/[0.04] px-4 py-2 text-center text-[11px] text-muted/90 sm:px-5">
        Record this tab with OBS or Xbox Game Bar for a real MP4 — or paste the prompt into your AI video generator for a
        rendered clip, then set <code className="font-mono text-accent/80">DEMO_VIDEO_URL</code> on{" "}
        <a href="/docs/demo" className="text-accent hover:underline">
          /docs/demo
        </a>
        .
      </p>
    </div>
  );
}
