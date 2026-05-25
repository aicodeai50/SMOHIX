"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  alpha: number;
};

const HUES = [185, 265, 155, 210, 290];

function spawnParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.6 + 0.4,
    hue: HUES[Math.floor(Math.random() * HUES.length)]!,
    alpha: Math.random() * 0.45 + 0.15,
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
    let frame = 0;
    let raf = 0;
    let particles: Particle[] = [];
    let breathe = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(110, Math.floor((w * h) / 14000));
      particles = Array.from({ length: count }, () => spawnParticle(w, h));
    };

    const draw = () => {
      frame += 1;
      breathe = reduced ? 0.5 : 0.5 + Math.sin(frame * 0.012) * 0.5;

      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.38;
      const singularity = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
      singularity.addColorStop(0, `rgba(94, 225, 255, ${0.07 * breathe})`);
      singularity.addColorStop(0.35, `rgba(167, 139, 250, ${0.04 * breathe})`);
      singularity.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = singularity;
      ctx.fillRect(0, 0, w, h);

      if (!reduced) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;
        }
      }

      const linkDist = 120;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const lineAlpha = (1 - dist / linkDist) * 0.12 * breathe;
            ctx.strokeStyle = `hsla(195, 90%, 70%, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 72%, ${p.alpha * breathe})`;
        ctx.fill();
      }

      if (!reduced && frame % 180 === 0) {
        const riftX = Math.random() * w;
        const riftY = Math.random() * h * 0.6;
        const rift = ctx.createLinearGradient(riftX - 80, riftY, riftX + 80, riftY);
        rift.addColorStop(0, "rgba(0,0,0,0)");
        rift.addColorStop(0.5, "rgba(167, 139, 250, 0.35)");
        rift.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rift;
        ctx.fillRect(riftX - 80, riftY - 1, 160, 2);
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
      className="zentro-quantum-canvas pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
