import React, { useEffect, useState } from 'react';
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
 * Painted silk-and-ink healer's forearm & hand reaching across the apothecary desk
 * to pinch the chosen herb and gently release it into the brass scale pan.
 */
export const HealerHandOverlay: React.FC<HealerHandOverlayProps> = ({ scoop, onComplete }) => {
  const [phase, setPhase] = useState<'grab' | 'carry' | 'drop'>('grab');

  useEffect(() => {
    if (!scoop) return;
    setPhase('grab');

    const raf = requestAnimationFrame(() => {
      setPhase('carry');
    });
    const dropTimer = window.setTimeout(() => {
      setPhase('drop');
    }, 430);
    const doneTimer = window.setTimeout(() => {
      onComplete(scoop.id);
    }, 840);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(dropTimer);
      window.clearTimeout(doneTimer);
    };
  }, [scoop, onComplete]);

  if (!scoop) return null;

  const isAtTarget = phase === 'carry' || phase === 'drop';
  const curX = isAtTarget ? scoop.toX : scoop.fromX;
  const curY = isAtTarget ? scoop.toY : scoop.fromY;

  return (
    <div
      className={`healer-hand-layer phase-${phase}`}
      aria-hidden="true"
      style={{
        transform: `translate3d(${curX}px, ${curY}px, 0)`
      }}
    >
      <div className="healer-hand-rig">
        {/* Pinched herb held at the painted thumb-index fingertips */}
        <div className={`pinched-herb ${phase === 'drop' ? 'releasing' : ''}`}>
          <BotanicalSvg herbId={scoop.herb.id} motif={scoop.herb.motif} size={42} bare />
        </div>

        {/* Dropping herb flecks when releasing onto the scale dish */}
        {phase === 'drop' && (
          <svg className="herb-drop-flecks" width="46" height="42" viewBox="0 0 46 42" fill="none">
            <g filter="url(#ink-brush-soft)">
              <path d="M16 4 C14 9 18 11 19 6 Z" fill="#23574C" />
              <path d="M25 8 C23 13 28 14 28 9 Z" fill="#9C6B24" />
              <path d="M21 14 C18 18 22 21 24 16 Z" fill="#A62620" opacity="0.8" />
            </g>
          </svg>
        )}

        <img
          src="/art/tools/healer-hand.png"
          width={186}
          height={186}
          alt=""
          style={{
            display: 'block',
            filter: 'drop-shadow(0 8px 12px rgba(18, 12, 8, 0.36))'
          }}
        />
      </div>
    </div>
  );
};
