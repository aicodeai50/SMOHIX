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
  twinkle: number;
};

const HUES = [185, 195, 265, 275, 155, 210, 290, 320];

function spawnParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.42,
    vy: (Math.random() - 0.5) * 0.42 - 0.08,
    r: Math.random() * 2.2 + 0.35,
    hue: HUES[Math.floor(Math.random() * HUES.length)]!,
    alpha: Math.random() * 0.55 + 0.2,
    twinkle: Math.random() * Math.PI * 2,
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

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(180, Math.floor((w * h) / 9000));
      particles = Array.from({ length: count }, () => spawnParticle(w, h));
    };

    const draw = () => {
      frame += 1;
      const breathe = reduced ? 0.55 : 0.45 + Math.sin(frame * 0.014) * 0.55;
      const pulse = reduced ? 1 : 0.85 + Math.sin(frame * 0.008) * 0.15;

      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.32;
      const coreR = Math.max(w, h) * 0.42 * pulse;

      const singularity = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      singularity.addColorStop(0, `rgba(255, 255, 255, ${0.09 * breathe})`);
      singularity.addColorStop(0.08, `rgba(94, 225, 255, ${0.14 * breathe})`);
      singularity.addColorStop(0.28, `rgba(167, 139, 250, ${0.08 * breathe})`);
      singularity.addColorStop(0.55, `rgba(52, 211, 153, ${0.04 * breathe})`);
      singularity.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = singularity;
      ctx.fillRect(0, 0, w, h);

      const nebula = ctx.createRadialGradient(w * 0.15, h * 0.7, 0, w * 0.15, h * 0.7, w * 0.45);
      nebula.addColorStop(0, `rgba(236, 72, 153, ${0.06 * breathe})`);
      nebula.addColorStop(0.5, `rgba(167, 139, 250, ${0.04 * breathe})`);
      nebula.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, w, h);

      if (!reduced) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.twinkle += 0.04;
          if (p.x < -24) p.x = w + 24;
          if (p.x > w + 24) p.x = -24;
          if (p.y < -24) p.y = h + 24;
          if (p.y > h + 24) p.y = -24;
        }
      }

      const linkDist = 130;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const lineAlpha = (1 - dist / linkDist) * 0.16 * breathe;
            ctx.strokeStyle = `hsla(195, 95%, 72%, ${lineAlpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const tw = reduced ? 1 : 0.65 + Math.sin(p.twinkle) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * tw, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 74%, ${p.alpha * breathe * tw})`;
        ctx.fill();

        if (p.r > 1.4 && !reduced) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${0.06 * breathe})`;
          ctx.fill();
        }
      }

      if (!reduced) {
        const ringR = 48 + Math.sin(frame * 0.02) * 12;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(94, 225, 255, ${0.25 * breathe})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, ringR * 1.8, frame * 0.004, frame * 0.004 + Math.PI * 1.2);
        ctx.strokeStyle = `rgba(167, 139, 250, ${0.18 * breathe})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (!reduced && frame % 140 === 0) {
        const riftX = Math.random() * w;
        const riftY = Math.random() * h * 0.65;
        const rift = ctx.createLinearGradient(riftX - 120, riftY, riftX + 120, riftY);
        rift.addColorStop(0, "rgba(0,0,0,0)");
        rift.addColorStop(0.45, "rgba(94, 225, 255, 0.5)");
        rift.addColorStop(0.5, "rgba(255, 255, 255, 0.85)");
        rift.addColorStop(0.55, "rgba(167, 139, 250, 0.5)");
        rift.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rift;
        ctx.fillRect(riftX - 120, riftY - 1.5, 240, 3);
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
