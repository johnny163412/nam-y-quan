import React, { useEffect, useRef, useState } from 'react';
import { Herb } from '../../types/tcm';
import { BotanicalSvg } from './BotanicalSvg';

export interface ScoopAnimationState {
  id: number;
  herb: Herb;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface HealerHandOverlayProps {
  scoop: ScoopAnimationState | null;
  onComplete: (id: number) => void;
}

const PETAL_OFFSETS = [
  { dx: -12, dy: 0, rot: -26, color: '#46744C', size: 6 },
  { dx: 4, dy: 6, rot: 22, color: '#B87B32', size: 5.5 },
  { dx: -4, dy: 12, rot: 40, color: '#5A8759', size: 6.5 },
  { dx: 11, dy: 16, rot: -18, color: '#9E3A26', size: 5 },
  { dx: -9, dy: 22, rot: 14, color: '#D49E48', size: 5.5 },
  { dx: 6, dy: 28, rot: -35, color: '#4E7C52', size: 6 }
];

/**
 * Hand-painted transparent ink-and-watercolor healer hand (`./art/tools/healer-hand.webp`)
 * arcing along a smooth 3D parabolic lift from open cedar drawer to suspended brass scale dish,
 * shedding fine golden pollen dust and tumbling herb petals on release.
 */
export const HealerHandOverlay: React.FC<HealerHandOverlayProps> = ({ scoop, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!scoop) return;
    setProgress(0);

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const totalMs = prefersReduced ? 120 : 980;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / totalMs);
      setProgress(p);
      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current(scoop.id);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [scoop]);

  if (!scoop) return null;

  const moveT = progress <= 0.18 ? 0 : progress >= 0.76 ? 1 : (progress - 0.18) / 0.58;
  // Smooth ease-in-out quintic for graceful human wrist deceleration
  const easedMove =
    moveT < 0.5
      ? 4 * moveT * moveT * moveT
      : 1 - Math.pow(-2 * moveT + 2, 3) / 2;

  const curX = scoop.fromX + (scoop.toX - scoop.fromX) * easedMove;
  const baseLineY = scoop.fromY + (scoop.toY - scoop.fromY) * easedMove;
  const arcLift = Math.sin(Math.PI * easedMove) * 74;
  const curY = baseLineY - arcLift;

  const isGrabbing = progress < 0.22;
  const isReleasing = progress >= 0.74;
  const releaseFall = isReleasing ? (progress - 0.74) / 0.26 : 0;
  const wristTilt = -10 + easedMove * 15 - (isReleasing ? 12 : 0) + (isGrabbing ? -5 * (1 - progress / 0.22) : 0);
  const fadeOutOpacity = progress > 0.86 ? Math.max(0, 1 - (progress - 0.86) / 0.14) : 1;

  return (
    <div
      className="healer-hand-layer"
      aria-hidden="true"
      style={{
        transform: `translate3d(${curX}px, ${curY}px, 0)`,
        opacity: fadeOutOpacity
      }}
    >
      {/* Dynamic soft desk shadow separating downward proportional to parabolic arc height */}
      <div
        className="healer-hand-shadow"
        style={{
          transform: `translate(-24px, ${22 + arcLift * 0.88}px) scale(${1.05 - arcLift * 0.004})`,
          opacity: Math.max(0.14, 0.46 - arcLift * 0.0038)
        }}
      />

      <div
        className="healer-hand-rig"
        style={{
          transform: `translate(-42px, -48px) rotate(${wristTilt}deg)`
        }}
      >
        {/* Falling herb petals & flecks separated under gravity */}
        {isReleasing && (
          <div
            className="herb-petal-cascade"
            style={{
              position: 'absolute',
              left: '36px',
              top: `${38 + releaseFall * 34}px`,
              opacity: Math.max(0, 1 - releaseFall * 0.8)
            }}
          >
            {PETAL_OFFSETS.map((pt, idx) => (
              <span
                key={idx}
                className="falling-botanical-fleck"
                style={{
                  left: `${pt.dx * (1 + releaseFall * 0.6)}px`,
                  top: `${pt.dy + releaseFall * (idx * 5)}px`,
                  width: `${pt.size}px`,
                  height: `${Math.round(pt.size * 0.55)}px`,
                  background: pt.color,
                  transform: `rotate(${pt.rot + releaseFall * 85}deg)`
                }}
              />
            ))}
          </div>
        )}

        {/* Pinched botanical specimen held cleanly at thumb & index fingertip (~30px, 34px) */}
        <div
          className="pinched-herb-bundle"
          style={{
            position: 'absolute',
            left: '16px',
            top: '20px',
            transform: isReleasing
              ? `translateY(${releaseFall * 28}px) scale(${1 - releaseFall * 0.4})`
              : `scale(${isGrabbing ? 0.72 + (progress / 0.22) * 0.28 : 1})`,
            opacity: isReleasing ? Math.max(0, 1 - releaseFall * 1.15) : 1
          }}
        >
          <BotanicalSvg herbId={scoop.herb.id} motif={scoop.herb.motif} size={42} bare />
        </div>

        {/* Genuine Hand-Painted Watercolor Healer Hand (Transparent PNG) */}
        <img
          src="./art/tools/healer-hand.webp"
          alt=""
          className="healer-hand-painted-img"
        />
      </div>
    </div>
  );
};
