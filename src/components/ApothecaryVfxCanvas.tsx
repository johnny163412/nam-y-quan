import React, { useEffect, useRef } from 'react';

export type ApothecaryVfxMode = 'hearth' | 'mortar' | 'wok-gold' | 'wok-honey';

interface ApothecaryVfxCanvasProps {
  mode: ApothecaryVfxMode;
  /** Normalized intensity 0.15..1.0 (e.g. fanHeat / 100 for hearth) */
  intensity?: number;
  /** Trigger bursts of sparks/dust (e.g. fanBlowing or kneading) */
  burstActive?: boolean;
  className?: string;
}

interface VfxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  kind: 'steam' | 'spark' | 'flake' | 'glint';
  rot: number;
  vRot: number;
  hue: string;
}

/**
 * High-craft 60fps Canvas2D volumetric particle & ember VFX engine.
 * Safe in headless/jsdom test environments (guards getContext + matchMedia).
 */
export const ApothecaryVfxCanvas: React.FC<ApothecaryVfxCanvasProps> = ({
  mode,
  intensity = 0.65,
  burstActive = false,
  className = 'apothecary-vfx-canvas'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intensityRef = useRef(intensity);
  const burstRef = useRef(burstActive);
  intensityRef.current = intensity;
  burstRef.current = burstActive;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const particles: VfxParticle[] = [];

    const spawnSteam = (initial = false) => {
      // Positioned cleanly around spout / wok herbs
      const originX = mode === 'hearth' ? w * 0.61 : w * 0.50;
      const originY = mode === 'hearth' ? h * 0.36 : h * 0.56;
      particles.push({
        x: originX + (Math.random() - 0.5) * (mode === 'hearth' ? 18 : 72),
        y: originY - (initial ? Math.random() * h * 0.35 : 0),
        vx: (Math.random() - 0.45) * 0.35,
        vy: -(0.55 + Math.random() * 0.65),
        size: 12 + Math.random() * 18,
        life: initial ? Math.random() * 90 : 0,
        maxLife: 85 + Math.random() * 55,
        kind: 'steam',
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
        hue: mode === 'wok-honey' ? '255, 224, 150' : '250, 242, 226'
      });
    };

    const spawnSpark = (strong = false) => {
      const originX = mode === 'hearth' ? w * 0.72 : w * 0.48;
      const originY = mode === 'hearth' ? h * 0.84 : h * 0.78;
      particles.push({
        x: originX + (Math.random() - 0.5) * 68,
        y: originY + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.6) * (strong ? 2.4 : 1.1),
        vy: -(1.4 + Math.random() * (strong ? 2.8 : 1.5)),
        size: 1.8 + Math.random() * 2.8,
        life: 0,
        maxLife: 38 + Math.random() * 34,
        kind: 'spark',
        rot: 0,
        vRot: 0,
        hue: Math.random() > 0.35 ? '255, 198, 72' : '255, 114, 42'
      });
    };

    const spawnMortarFlake = () => {
      const originX = w * 0.46 + (Math.random() - 0.5) * 56;
      const originY = h * 0.54 + (Math.random() - 0.5) * 16;
      const herbPalette = ['142, 186, 108', '208, 166, 92', '108, 146, 86', '228, 184, 104'];
      particles.push({
        x: originX,
        y: originY,
        vx: (Math.random() - 0.5) * 3.8,
        vy: -(2.8 + Math.random() * 4.2),
        size: 2.5 + Math.random() * 3.8,
        life: 0,
        maxLife: 42 + Math.random() * 22,
        kind: 'flake',
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        hue: herbPalette[Math.floor(Math.random() * herbPalette.length)]
      });
    };

    const spawnWokGlint = () => {
      particles.push({
        x: w * 0.52 + (Math.random() - 0.5) * 115,
        y: h * 0.56 + (Math.random() - 0.5) * 26,
        vx: (Math.random() - 0.5) * 1.1,
        vy: -(1.1 + Math.random() * 1.6),
        size: 2.2 + Math.random() * 3.2,
        life: 0,
        maxLife: 48 + Math.random() * 24,
        kind: 'glint',
        rot: 0,
        vRot: 0,
        hue: mode === 'wok-honey' ? '248, 186, 56' : '236, 178, 76'
      });
    };

    if (mode !== 'mortar') {
      for (let i = 0; i < 16; i++) spawnSteam(true);
    }

    let rafId = 0;
    let tick = 0;
    let prevBurst = burstRef.current;

    const frame = () => {
      tick += 1;
      const curIntensity = Math.max(0.15, Math.min(1.0, intensityRef.current));
      ctx.clearRect(0, 0, w, h);

      // 1. Dynamic warm coal / pounding glow overlay
      if (mode === 'hearth' || mode === 'wok-gold' || mode === 'wok-honey') {
        const pulse = 0.84 + 0.16 * Math.sin(tick * 0.12);
        const cx = mode === 'hearth' ? w * 0.72 : w * 0.55;
        const cy = mode === 'hearth' ? h * 0.85 : h * 0.84;
        const radius = (mode === 'hearth' ? w * 0.34 : w * 0.42) * (0.75 + curIntensity * 0.45);
        const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
        grad.addColorStop(0, `rgba(255, 168, 56, ${0.42 * curIntensity * pulse})`);
        grad.addColorStop(0.45, `rgba(232, 82, 24, ${0.24 * curIntensity * pulse})`);
        grad.addColorStop(1, 'rgba(20, 8, 2, 0)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // 2. Spawners per mode
      if (mode === 'hearth') {
        if (tick % (curIntensity > 0.7 ? 5 : 8) === 0 && particles.length < 48) {
          spawnSteam(false);
        }
        if ((tick % 4 === 0 && Math.random() < curIntensity * 0.6) || (burstRef.current && tick % 2 === 0)) {
          spawnSpark(burstRef.current);
        }
        if (burstRef.current && !prevBurst) {
          for (let i = 0; i < 12; i++) spawnSpark(true);
        }
        prevBurst = burstRef.current;
      } else if (mode === 'mortar') {
        // Periodic rhythm synced with pestle impact (~every 22 ticks)
        if (tick % 24 === 6) {
          for (let i = 0; i < 14; i++) spawnMortarFlake();
          for (let i = 0; i < 4; i++) spawnSteam(false);
        }
      } else {
        // Wok Gold / Wok Honey
        if (tick % 6 === 0 && particles.length < 46) spawnSteam(false);
        if (tick % 5 === 0) spawnWokGlint();
        if (tick % 8 === 0) spawnSpark(false);
      }

      // 3. Particle update & render
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const progress = p.life / p.maxLife;
        const alpha =
          progress < 0.2 ? progress / 0.2 : Math.max(0, 1 - (progress - 0.2) / 0.8);

        if (p.kind === 'steam') {
          p.x += p.vx + Math.sin(tick * 0.05 + p.rot) * 0.45;
          p.y += p.vy;
          p.size += 0.22;
          const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(${p.hue}, ${alpha * 0.24})`);
          grad.addColorStop(1, `rgba(${p.hue}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'spark' || p.kind === 'glint') {
          p.x += p.vx + Math.sin(tick * 0.14 + p.y * 0.05) * 0.25;
          p.y += p.vy;
          p.vy += p.kind === 'spark' ? 0.015 : 0.03;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(${p.hue}, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.kind === 'flake') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.19; // gravity
          p.rot += p.vRot;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(${p.hue}, ${alpha * 0.94})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      width={380}
      height={210}
      className={className}
      aria-hidden="true"
    />
  );
};
