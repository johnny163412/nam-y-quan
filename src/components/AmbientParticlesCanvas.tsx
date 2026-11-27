import React, { useEffect, useRef } from 'react';
import { useOnScreen } from './useOnScreen';

interface AmbientParticlesCanvasProps {
  mode: 'rain' | 'sunbeams' | 'embers' | 'garden';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

export const AmbientParticlesCanvas: React.FC<AmbientParticlesCanvasProps> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onScreen = useOnScreen(canvasRef);

  useEffect(() => {
    if (!onScreen) return; // room is off the track's visible window
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 640;
    const h = 260;
    const count = mode === 'rain' ? 42 : mode === 'embers' ? 24 : 26;
    const particles: Particle[] = Array.from({ length: count }, (_, idx) => ({
      x: (idx * 37) % w,
      y: (idx * 53) % h,
      vx: mode === 'rain' ? -1.4 : mode === 'embers' ? (Math.random() - 0.5) * 0.5 : (Math.random() - 0.35) * 0.35,
      vy: mode === 'rain' ? 5.2 + Math.random() * 2.5 : mode === 'embers' ? -(0.6 + Math.random() * 0.8) : -(0.15 + Math.random() * 0.35),
      size: mode === 'rain' ? 10 : mode === 'embers' ? 1.8 + Math.random() * 1.8 : 1.5 + Math.random() * 2.4,
      alpha: 0.25 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2
    }));

    let rafId = 0;
    let tick = 0;

    const draw = () => {
      tick += 0.03;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (mode !== 'rain') {
          p.x += Math.sin(tick + p.phase) * 0.25;
        }
        if (p.y > h + 14) p.y = -10;
        if (p.y < -14) p.y = h + 10;
        if (p.x < -14) p.x = w + 10;
        if (p.x > w + 14) p.x = -10;

        if (mode === 'rain') {
          ctx.strokeStyle = `rgba(222, 234, 240, ${p.alpha * 0.65})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + p.size);
          ctx.stroke();
        } else if (mode === 'embers') {
          const glow = 0.5 + 0.5 * Math.sin(tick * 2 + p.phase);
          ctx.fillStyle = `rgba(255, ${135 + Math.round(glow * 70)}, 48, ${p.alpha * (0.55 + glow * 0.45)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (mode === 'garden') {
          const pulse = 0.4 + 0.6 * Math.sin(tick * 1.6 + p.phase);
          ctx.fillStyle = `rgba(215, 244, 154, ${p.alpha * pulse})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(250, 218, 146, ${p.alpha * 0.58})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [mode, onScreen]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={260}
      className="ambient-particles-canvas"
      aria-hidden="true"
    />
  );
};
