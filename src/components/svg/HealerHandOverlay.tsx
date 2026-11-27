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

/**
 * Multi-joint articulated indigo-sleeved healer hand that reaches into an open wood drawer,
 * pinches a bundle of dried herbs, arcs in a 3D parabolic lift with desk shadow,
 * and releases falling botanical flakes onto the hanging brass scale dish.
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
    const totalMs = prefersReduced ? 120 : 940;
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

  // Phases:
  // 0.00 - 0.24: Reach into drawer & pinch shut
  // 0.24 - 0.72: Parabolic 3D lift & carry across desk
  // 0.72 - 1.00: Spread thumb/index fingers & scatter falling herbs into dish
  const moveT = progress <= 0.22 ? 0 : progress >= 0.74 ? 1 : (progress - 0.22) / 0.52;
  const easedMove = 1 - Math.pow(1 - moveT, 3);

  const curX = scoop.fromX + (scoop.toX - scoop.fromX) * easedMove;
  const baseLineY = scoop.fromY + (scoop.toY - scoop.fromY) * easedMove;
  const arcLift = Math.sin(Math.PI * easedMove) * 64;
  const curY = baseLineY - arcLift;

  const isGrabbing = progress < 0.24;
  const isReleasing = progress >= 0.72;
  const pinchCloseFactor = isGrabbing ? progress / 0.24 : isReleasing ? 1 - (progress - 0.72) / 0.28 : 1;
  const wristTilt = -12 + easedMove * 18 - (isReleasing ? 10 : 0);
  const releaseFall = isReleasing ? (progress - 0.72) / 0.28 : 0;

  return (
    <div
      className="healer-hand-layer"
      aria-hidden="true"
      style={{
        transform: `translate3d(${curX}px, ${curY}px, 0)`
      }}
    >
      {/* Dynamic desk shadow separating downward proportional to parabolic arc height */}
      <div
        className="healer-hand-shadow"
        style={{
          transform: `translate(-28px, ${18 + arcLift * 0.85}px) scale(${1 - arcLift * 0.0045})`,
          opacity: Math.max(0.18, 0.48 - arcLift * 0.004)
        }}
      />

      <div
        className="healer-hand-rig"
        style={{
          transform: `translate(-46px, -74px) rotate(${wristTilt}deg)`
        }}
      >
        {/* Falling separated herb leaves during release */}
        {isReleasing && (
          <svg
            className="herb-drop-stream"
            width="64"
            height="68"
            viewBox="0 0 64 68"
            fill="none"
            style={{
              position: 'absolute',
              left: '14px',
              top: `${32 + releaseFall * 28}px`,
              opacity: Math.max(0, 1 - releaseFall * 0.75)
            }}
          >
            <ellipse cx="22" cy="10" rx="5" ry="2.6" transform="rotate(-24 22 10)" fill="#3F704D" />
            <ellipse cx="36" cy="18" rx="4.5" ry="2.3" transform="rotate(18 36 18)" fill="#B57B32" />
            <ellipse cx="27" cy="28" rx="5.2" ry="2.5" transform="rotate(34 27 28)" fill="#528258" />
            <circle cx="33" cy="36" r="2.4" fill="#9E3A26" />
          </svg>
        )}

        {/* Held Herb Bundle between thumb and index fingertip */}
        <div
          className="pinched-herb-bundle"
          style={{
            position: 'absolute',
            left: '20px',
            top: '28px',
            transform: isReleasing
              ? `translateY(${releaseFall * 24}px) scale(${1 - releaseFall * 0.35})`
              : `scale(${0.86 + pinchCloseFactor * 0.14})`,
            opacity: isReleasing ? Math.max(0, 1 - releaseFall * 1.1) : 1
          }}
        >
          <BotanicalSvg herbId={scoop.herb.id} motif={scoop.herb.motif} size={40} bare />
        </div>

        {/* Articulated East Asian Healer Sleeve, Wrist, Palm & Pinching Fingers */}
        <svg width="176" height="164" viewBox="0 0 176 164" fill="none">
          <defs>
            <linearGradient id="sleeveIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2E4A5E" />
              <stop offset="65%" stopColor="#1E3140" />
              <stop offset="100%" stopColor="#121F2A" />
            </linearGradient>
            <linearGradient id="skinWarm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E9C7A3" />
              <stop offset="100%" stopColor="#CFA177" />
            </linearGradient>
          </defs>

          {/* Back curled fingers (ring & pinky) */}
          <path d="M58 58 Q46 72 52 84 Q58 88 64 78" fill="#C9996F" stroke="#5A3921" strokeWidth="1.5" />

          {/* Forearm Sleeve (Áo vải chàm + viền lụa trắng ngà) */}
          <path d="M174 128 L108 66 L78 96 L142 162 Z" fill="url(#sleeveIndigo)" stroke="#15232E" strokeWidth="2" />
          <path d="M111 69 L81 99 L88 106 L118 76 Z" fill="#EFE4CE" stroke="#7E6444" strokeWidth="1.2" />

          {/* Wrist & Palm */}
          <path d="M98 76 Q82 54 62 46 Q46 42 40 54 Q46 72 68 88 L88 94 Z" fill="url(#skinWarm)" stroke="#5A3921" strokeWidth="1.6" />

          {/* Articulated Index Finger closing down to pinch */}
          <g
            style={{
              transformOrigin: '52px 48px',
              transform: `rotate(${-14 + pinchCloseFactor * 18}deg)`
            }}
          >
            <path d="M54 45 Q34 32 22 40 Q18 47 28 52 Q40 53 50 53" fill="url(#skinWarm)" stroke="#5A3921" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Articulated Thumb rising up to meet Index Finger */}
          <g
            style={{
              transformOrigin: '56px 74px',
              transform: `rotate(${16 - pinchCloseFactor * 20}deg)`
            }}
          >
            <path d="M58 74 Q42 74 30 62 Q26 54 34 51 Q44 52 54 62" fill="url(#skinWarm)" stroke="#5A3921" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
};
