import React, { useEffect, useRef } from 'react';

export type WeatherKind = 'drizzle' | 'cold-rain' | 'haze' | 'leaves';

/** Solar term -> the weather drawn outside the windows / over the garden. */
export const SOLAR_TERM_WEATHER: Record<string, WeatherKind> = {
  'Xuân Vũ': 'drizzle',
  'Hạ Thử': 'haze',
  'Thu Táo': 'leaves',
  'Đông Hàn': 'cold-rain'
};

// Drawn on the 16:9 room stage, so it lines up with the painting at any viewport size.
const W = 640;
const H = 360;

interface Drop {
  x: number;
  y: number;
  v: number;
  len: number;
  a: number;
  phase: number;
  rot: number;
}

const COUNTS: Record<WeatherKind, number> = { drizzle: 90, 'cold-rain': 150, haze: 34, leaves: 16 };

export const WeatherCanvas: React.FC<{ kind: WeatherKind }> = ({ kind }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const drops: Drop[] = Array.from({ length: COUNTS[kind] }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      v: kind === 'cold-rain' ? 7 + Math.random() * 4 : kind === 'drizzle' ? 3 + Math.random() * 2 : 0.3 + Math.random() * 0.5,
      len: kind === 'cold-rain' ? 12 + Math.random() * 8 : kind === 'drizzle' ? 6 + Math.random() * 5 : 2 + Math.random() * 3,
      a: 0.2 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2
    }));
    const slant = kind === 'cold-rain' ? -0.32 : -0.12;

    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // slow banks of mist (rain) or heat bloom (summer) behind everything
      if (kind !== 'leaves') {
        for (let i = 0; i < 3; i++) {
          const mx = ((t * (6 + i * 3) + i * 230) % (W + 300)) - 150;
          const my = H * (0.42 + i * 0.12);
          const g = ctx.createRadialGradient(mx, my, 0, mx, my, 170);
          const c = kind === 'haze' ? '255, 236, 190' : kind === 'cold-rain' ? '205, 220, 235' : '230, 238, 228';
          g.addColorStop(0, `rgba(${c}, ${kind === 'haze' ? 0.16 : 0.22})`);
          g.addColorStop(1, `rgba(${c}, 0)`);
          ctx.fillStyle = g;
          ctx.fillRect(mx - 170, my - 170, 340, 340);
        }
      }

      // a gust every few seconds bends the cold rain further
      const gust = kind === 'cold-rain' ? 1 + 0.6 * Math.max(0, Math.sin(t * 0.7)) : 1;
      for (const d of drops) {
        if (kind === 'drizzle' || kind === 'cold-rain') {
          d.y += d.v;
          d.x += d.v * slant * gust;
          if (d.y > H) {
            d.y = -d.len;
            d.x = Math.random() * (W + 80);
          }
          ctx.strokeStyle = `rgba(226, 236, 242, ${d.a})`;
          ctx.lineWidth = kind === 'cold-rain' ? 1.1 : 0.8;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.len * slant * gust, d.y + d.len);
          ctx.stroke();
        } else if (kind === 'haze') {
          // pollen and dust drifting up through the heat
          d.y -= d.v * 0.5;
          d.x += Math.sin(t + d.phase) * 0.3;
          if (d.y < -4) d.y = H + 4;
          ctx.fillStyle = `rgba(255, 228, 160, ${d.a * (0.5 + 0.5 * Math.sin(t * 2 + d.phase))})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.len * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // autumn leaves tumbling down and across
          d.y += d.v * 1.6;
          d.x += 0.5 + Math.sin(t * 1.3 + d.phase) * 0.9;
          d.rot += 0.03;
          if (d.y > H + 10 || d.x > W + 10) {
            d.y = -10;
            d.x = Math.random() * W - 60;
          }
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.scale(1, Math.abs(Math.sin(t * 2 + d.phase)) * 0.8 + 0.2); // flutter
          ctx.fillStyle = `rgba(${190 + ((d.phase * 20) | 0)}, ${120 + ((d.phase * 12) | 0)}, 48, ${0.55 + d.a * 0.4})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 2.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [kind]);

  return <canvas ref={ref} width={W} height={H} className={`room-weather is-${kind}`} aria-hidden="true" />;
};
