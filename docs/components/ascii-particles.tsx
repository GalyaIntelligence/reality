'use client';

import { useEffect, useRef } from 'react';

const GLYPHS = '.:·+*#%@░▒▓─│┌┐└┘├┤';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glyph: string;
  life: number;
  maxLife: number;
};

/**
 * Lightweight ASCII-esque particle field for the Fumadocs home hero.
 */
export function AsciiParticles({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) {
        const count = Math.min(90, Math.floor((w * h) / 9000));
        particles = Array.from({ length: count }, () => spawn());
      }
    };

    const spawn = (): Particle => {
      const fromLeft = Math.random() > 0.45;
      return {
        x: fromLeft ? Math.random() * w * 0.35 : w * (0.55 + Math.random() * 0.4),
        y: Math.random() * h,
        vx: fromLeft ? 0.25 + Math.random() * 0.55 : -(0.25 + Math.random() * 0.55),
        vy: (Math.random() - 0.5) * 0.35,
        glyph: GLYPHS[(Math.random() * GLYPHS.length) | 0]!,
        life: 0,
        maxLife: 180 + Math.random() * 220,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // soft link lines between nearby particles (ASCII constellation)
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90) {
            const alpha = (1 - dist / 90) * 0.2;
            ctx.strokeStyle = `rgba(100, 116, 139, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx;
          p.y += p.vy;
          p.life += 1;
          p.vx += (w * 0.5 - p.x) * 0.00008;
          p.vy += (h * 0.45 - p.y) * 0.00008;
        }
        const fade = Math.min(1, p.life / 40, (p.maxLife - p.life) / 50);
        ctx.fillStyle = `rgba(71, 85, 105, ${fade * 0.55})`;
        ctx.fillText(p.glyph, p.x, p.y);

        if (
          p.life > p.maxLife ||
          p.x < -20 ||
          p.x > w + 20 ||
          p.y < -20 ||
          p.y > h + 20
        ) {
          Object.assign(p, spawn(), { life: 0 });
        }
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden
    />
  );
}
