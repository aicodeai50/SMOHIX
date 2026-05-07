"use client";

import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Pause,
  Play,
  Plug,
  Shield,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";

import type { DemoScene } from "@/lib/docs/demo-scenes";
import { DEMO_SCENES } from "@/lib/docs/demo-scenes";

const ICONS: Record<
  DemoScene["icon"],
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  sparkles: Sparkles,
  "layout-grid": LayoutGrid,
  "bar-chart": BarChart3,
  alert: AlertTriangle,
  workflow: Workflow,
  shield: Shield,
  plug: Plug,
  book: BookOpen,
};

const AUTO_MS = 9000;

export function InteractiveProductDemo() {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scene = DEMO_SCENES[index];
  const Icon = ICONS[scene.icon];
  const narration = scene.say.join(" ");
  const last = index === DEMO_SCENES.length - 1;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const n = i + delta;
        if (n < 0) return DEMO_SCENES.length - 1;
        if (n >= DEMO_SCENES.length) return 0;
        return n;
      });
    },
    [],
  );

  useEffect(() => {
    if (!auto) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1 >= DEMO_SCENES.length ? 0 : i + 1));
    }, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [auto]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
        setAuto(false);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
        setAuto(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <section
      className="mt-10 overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.06] to-transparent"
      aria-label="Interactive product tour"
    >
      <div className="border-b border-white/[0.06] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Interactive tour</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuto((a) => !a)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/[0.08]"
            >
              {auto ? (
                <>
                  <Pause className="size-3.5" aria-hidden />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-3.5" aria-hidden />
                  Auto-advance (~{Math.round(AUTO_MS / 1000)}s)
                </>
              )}
            </button>
            <span className="text-xs text-muted">
              {index + 1} / {DEMO_SCENES.length}
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted">
          Use Prev / Next or keyboard arrows. Links open the real console route (sign in if required).
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        <div className="relative flex min-h-[220px] flex-col justify-center bg-black/20 px-6 py-10 sm:min-h-[260px] sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/15 via-transparent to-transparent" />
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-accent shadow-lg shadow-black/20">
              <Icon className="size-8" aria-hidden />
            </div>
            <p className="text-xs font-mono text-accent/90">{scene.route}</p>
            <h3 className="mt-2 max-w-xl text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {scene.title}
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{narration}</p>
          </div>
        </div>

        <aside className="border-t border-white/[0.06] bg-black/15 p-4 sm:p-5 lg:border-l lg:border-t-0">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Try it</h4>
          <ul className="mt-2 space-y-2 text-sm leading-snug text-muted">
            {scene.do.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent/60" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <Link
            href={scene.route}
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-accent px-3 py-2 text-center text-xs font-semibold text-background hover:opacity-90"
          >
            Open {scene.route}
          </Link>
          <p className="mt-3 text-[11px] leading-relaxed text-muted/90">
            This page is the stand-in for a recorded video: same storyboard, no upload required.
          </p>
        </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => {
            go(-1);
            setAuto(false);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-sm font-medium text-foreground hover:bg-white/[0.05]"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </button>

        <div className="flex flex-wrap justify-center gap-1.5">
          {DEMO_SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to scene ${i + 1}: ${s.title}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => {
                setIndex(i);
                setAuto(false);
              }}
              className={`size-2.5 rounded-full transition ${
                i === index ? "scale-110 bg-accent" : "bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            go(1);
            setAuto(false);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-2 text-sm font-medium text-foreground hover:bg-white/[0.05]"
        >
          {last ? "Start over" : "Next"}
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
