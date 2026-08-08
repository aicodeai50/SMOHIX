"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
};

function spawnParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12,
    r: Math.random() * 1.1 + 0.25,
    alpha: Math.random() * 0.22 + 0.08,
  };
}

export function QuantumDimension() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(36, Math.floor((w * h) / 28000));
      particles = Array.from({ length: count }, () => spawnParticle(w, h));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.25;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
      glow.addColorStop(0, "rgba(94, 225, 255, 0.05)");
      glow.addColorStop(0.4, "rgba(167, 139, 250, 0.025)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      if (!reduced) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -12) p.x = w + 12;
          if (p.x > w + 12) p.x = -12;
          if (p.y < -12) p.y = h + 12;
          if (p.y > h + 12) p.y = -12;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(148, 210, 255, ${p.alpha})`;
          ctx.fill();
        }
      }

      raf = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="smohix-quantum-canvas pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
