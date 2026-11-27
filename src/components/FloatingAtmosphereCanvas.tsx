import React, { useEffect, useRef } from 'react';

interface FloatingAtmosphereCanvasProps {
  activeRoom: 0 | 1 | 2 | 3;
  hasIncenseBurner: boolean;
}

interface DriftMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  alpha: number;
  kind: 'leaf' | 'incense' | 'ember';
}

export const FloatingAtmosphereCanvas: React.FC<FloatingAtmosphereCanvasProps> = ({
  activeRoom,
  hasIncenseBurner
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = activeRoom === 3 ? 18 : activeRoom === 2 ? 16 : hasIncenseBurner ? 16 : 11;
    const motes: DriftMote[] = Array.from({ length: count }, (_, i) => {
      const kind: DriftMote['kind'] =
        activeRoom === 2
          ? i % 3 === 0
            ? 'incense'
            : 'ember'
          : activeRoom === 3
          ? 'leaf'
          : i % 2 === 0
          ? 'incense'
          : 'leaf';
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: kind === 'leaf' ? 0.35 + Math.random() * 0.45 : (Math.random() - 0.5) * 0.28,
        vy:
          kind === 'leaf'
            ? 0.25 + Math.random() * 0.35
            : -(0.28 + Math.random() * 0.42),
        size: kind === 'incense' ? 14 + Math.random() * 18 : kind === 'leaf' ? 5 + Math.random() * 4 : 2 + Math.random() * 2,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.018,
        alpha: kind === 'incense' ? 0.08 + Math.random() * 0.08 : 0.26 + Math.random() * 0.26,
        kind
      };
    });

    let rafId = 0;
    let t = 0;
    const draw = () => {
      t += 0.018;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const m of motes) {
        m.x += m.vx + Math.sin(t + m.rot) * 0.25;
        m.y += m.vy;
        m.rot += m.vrot;

        if (m.y < -30) m.y = canvas.height + 24;
        if (m.y > canvas.height + 30) m.y = -24;
        if (m.x < -30) m.x = canvas.width + 24;
        if (m.x > canvas.width + 30) m.x = -24;

        if (m.kind === 'incense') {
          const g = ctx.createRadialGradient(m.x, m.y, 1, m.x, m.y, m.size);
          g.addColorStop(0, `rgba(244, 232, 206, ${m.alpha})`);
          g.addColorStop(1, 'rgba(244, 232, 206, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (m.kind === 'ember') {
          ctx.fillStyle = `rgba(255, 168, 72, ${m.alpha * (0.65 + 0.35 * Math.sin(t * 3 + m.rot))})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(m.rot);
          ctx.fillStyle =
            activeRoom === 3
              ? `rgba(116, 176, 112, ${m.alpha})`
              : `rgba(208, 168, 96, ${m.alpha * 0.85})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, m.size, m.size * 0.44, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [activeRoom, hasIncenseBurner]);

  return <canvas ref={canvasRef} className="floating-atmosphere-canvas" aria-hidden="true" />;
};
