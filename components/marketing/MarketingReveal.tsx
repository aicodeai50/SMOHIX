"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { mRevealVisible, mSectionEnter } from "@/lib/marketing-layout";

type MarketingRevealProps = {
  as?: "section" | "article" | "div";
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

/**
 * Scroll-triggered fade-up for marketing blocks. Adds `mSectionEnter` and toggles
 * `mRevealVisible` when the element crosses the viewport (once). Reduced motion:
 * skips the observer and marks visible immediately (before paint).
 */
export function MarketingReveal({
  as,
  className = "",
  children,
  ...rest
}: MarketingRevealProps) {
  const tag = as ?? "section";
  const sectionRef = useRef<HTMLElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const el =
      tag === "article"
        ? articleRef.current
        : tag === "div"
          ? divRef.current
          : sectionRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setVisible(true));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            queueMicrotask(() => setVisible(true));
            io.disconnect();
            return;
          }
        }
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.06 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [tag]);

  const merged = [className, mSectionEnter, visible ? mRevealVisible : ""]
    .filter(Boolean)
    .join(" ");

  if (tag === "article") {
    return (
      <article ref={articleRef} className={merged} {...rest}>
        {children}
      </article>
    );
  }
  if (tag === "div") {
    return (
      <div ref={divRef} className={merged} {...rest}>
        {children}
      </div>
    );
  }
  return (
    <section ref={sectionRef} className={merged} {...rest}>
      {children}
    </section>
  );
}
