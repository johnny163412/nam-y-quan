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
 * Hand-drawn traditional healer's sleeve & hand reaching across the desk
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
        {/* Pinched herb held at fingertips until drop */}
        <div className={`pinched-herb ${phase === 'drop' ? 'releasing' : ''}`}>
          <BotanicalSvg motif={scoop.herb.motif} size={30} />
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

        {/* Hand-drawn Thầy Lang Sleeve + Wrist + Pinching Fingers */}
        <svg
          width="175"
          height="130"
          viewBox="0 0 175 130"
          fill="none"
          style={{ overflow: 'visible' }}
        >
          <g filter="url(#ink-brush-soft)" strokeLinecap="round" strokeLinejoin="round">
            {/* Wide traditional indigo-brown sleeve cuff (Ống tay áo thụng thầy lang) */}
            <path
              d="M92 54 C118 52 146 60 172 78 L156 126 C126 114 102 98 84 82 C84 72 87 62 92 54 Z"
              fill="#2B3D4F"
              stroke="#2F231A"
              strokeWidth="1.8"
            />
            <path
              d="M84 82 C90 73 94 64 95 54 M96 89 C104 78 109 67 110 56"
              stroke="#EFE6D2"
              strokeWidth="2.2"
              opacity="0.82"
            />
            <path d="M108 75 C124 83 140 94 156 105" stroke="#1E2B38" strokeWidth="1.2" opacity="0.55" />

            {/* Wrist & Back of Hand */}
            <path
              d="M90 61 C76 57 62 52 51 44 C43 39 38 35 33 34 C31 37 35 42 42 46
                 C31 44 22 41 18 44 C17 48 26 52 38 54
                 C28 56 22 59 23 63 C25 66 36 64 47 62
                 C41 67 39 71 42 74 C47 76 58 72 67 71
                 C76 72 82 75 86 78 Z"
              fill="#EAD0B3"
              stroke="#2F231A"
              strokeWidth="1.65"
            />

            {/* Thumb pinching toward forefinger */}
            <path
              d={
                phase === 'drop'
                  ? 'M49 58 C41 59 33 57 29 52 C31 49 38 50 45 53'
                  : 'M49 58 C38 56 30 51 24 44 C26 41 34 44 42 49'
              }
              fill="#E5C5A3"
              stroke="#2F231A"
              strokeWidth="1.5"
            />

            {/* Subtle knuckle & tendon ink lines */}
            <path d="M58 55 Q66 57 74 60 M56 62 Q64 63 72 65" stroke="#9C7A5B" strokeWidth="1" />
          </g>
        </svg>
      </div>
    </div>
  );
};
