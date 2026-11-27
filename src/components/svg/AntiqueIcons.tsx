import React from 'react';

export type AntiqueIconName =
  | 'mirror'
  | 'ear-wave'
  | 'bamboo-slips'
  | 'pulse-pillow'
  | 'scroll'
  | 'bell'
  | 'flame'
  | 'tally-board'
  | 'porcelain-pot'
  | 'tea-cup'
  | 'brass-cog'
  | 'yin-yang'
  | 'check-seal'
  | 'star-seal';

interface AntiqueIconProps {
  name: AntiqueIconName;
  size?: number;
  className?: string;
}

/**
 * Hand-crafted antique bronze, cinnabar, and brass vector glyphs
 * replacing all OS-rendered Unicode emojis across the apothecary UI.
 */
export const AntiqueIcon: React.FC<AntiqueIconProps> = ({
  name,
  size = 16,
  className
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0
      }}
    >
      {name === 'mirror' && (
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="9.5" r="6.5" fill="rgba(231,185,106,0.22)" />
          <circle cx="12" cy="9.5" r="4" strokeDasharray="2 1.8" />
          <path d="M10.2 15.8 L9.5 21.5 Q12 22.5 14.5 21.5 L13.8 15.8 Z" fill="rgba(207,160,78,0.35)" />
        </g>
      )}

      {name === 'ear-wave' && (
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 17.5 C7.5 17.5 6.5 15.8 7 13.5 C7.6 10.5 6 8.5 7.5 5.8 C9 3.4 13.4 3.5 14.5 6.4 C15.4 8.7 13.4 10.6 12.2 12 C11.2 13.1 11.4 15.5 10.4 16.8 Z" fill="rgba(231,185,106,0.18)" />
          <path d="M16.8 8.2 Q19 10.5 16.8 13" />
          <path d="M19.2 6.5 Q22.2 10.5 19.2 14.8" />
        </g>
      )}

      {name === 'bamboo-slips' && (
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="4" height="16" rx="1" fill="rgba(222,188,120,0.3)" transform="rotate(-8 6 12)" />
          <rect x="10" y="3" width="4" height="17" rx="1" fill="rgba(222,188,120,0.38)" />
          <rect x="16" y="4.5" width="4" height="15.5" rx="1" fill="rgba(222,188,120,0.28)" transform="rotate(8 18 12)" />
          <line x1="4.5" y1="8.5" x2="19.5" y2="8.5" stroke="#A62620" strokeWidth="1.3" />
          <line x1="4.8" y1="15.5" x2="19.2" y2="15.5" stroke="#A62620" strokeWidth="1.3" />
        </g>
      )}

      {name === 'pulse-pillow' && (
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16 C4 12.5 8 11.5 12 11.5 C16 11.5 20 12.5 20 16 L19 19 C15 20 9 20 5 19 Z" fill="rgba(207,160,78,0.28)" />
          <path d="M3.5 9.5 L7.5 9.5 L9.2 5.5 L11.5 11.5 L13.8 7.5 L15.5 9.5 L20.5 9.5" stroke="#C84B36" strokeWidth="1.6" />
        </g>
      )}

      {name === 'scroll' && (
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="4" width="14" height="16" rx="1.5" fill="rgba(235,214,174,0.25)" />
          <line x1="3.5" y1="5" x2="20.5" y2="5" strokeWidth="2" />
          <line x1="3.5" y1="19" x2="20.5" y2="19" strokeWidth="2" />
          <line x1="8.5" y1="9" x2="15.5" y2="9" />
          <line x1="8.5" y1="12.5" x2="15.5" y2="12.5" />
          <rect x="13" y="14.2" width="3.2" height="3.2" fill="#A62620" stroke="none" />
        </g>
      )}

      {name === 'bell' && (
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 15 C7 9.5 8.5 5.5 12 5.5 C15.5 5.5 17 9.5 17 15 L19 17.5 L5 17.5 Z" fill="rgba(231,185,106,0.34)" />
          <circle cx="12" cy="3.8" r="1.3" />
          <circle cx="12" cy="19.3" r="1.6" fill="currentColor" />
        </g>
      )}

      {name === 'flame' && (
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M12.5 2.5 C13.5 6 17.8 8.2 17.8 13.5 C17.8 17.4 15.2 20.5 12 20.5 C8.5 20.5 6 17.8 6 13.8 C6 10.6 7.8 8.5 9.6 6.8 C9.8 9 11 9.5 11.4 8 C11.9 6.2 12 4 12.5 2.5 Z"
            fill="rgba(220,94,48,0.45)"
          />
          <path
            d="M12 11.5 C13.5 13 14.3 14.6 14 16.5 C13.7 17.8 12.8 18.6 11.8 18.6 C10.4 18.6 9.6 17.2 9.8 15.6 C10 14.2 11 12.8 12 11.5 Z"
            fill="#F4B955"
            stroke="none"
          />
        </g>
      )}

      {name === 'tally-board' && (
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="4.5" width="14" height="16.5" rx="1.8" fill="rgba(235,214,174,0.2)" />
          <path d="M9 4.5 C9 3 10.3 2.5 12 2.5 C13.7 2.5 15 3 15 4.5" />
          <line x1="8.5" y1="9.5" x2="15.5" y2="9.5" />
          <line x1="8.5" y1="13" x2="15.5" y2="13" />
          <line x1="8.5" y1="16.5" x2="13" y2="16.5" />
        </g>
      )}

      {name === 'porcelain-pot' && (
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 11.5 C6.5 8.5 9 7.5 12 7.5 C15 7.5 17.5 8.5 17.5 11.5 C17.5 16.5 15.2 19.5 12 19.5 C8.8 19.5 6.5 16.5 6.5 11.5 Z" fill="rgba(164,198,214,0.35)" />
          <path d="M9 7.5 L15 7.5 L14.4 5.5 L9.6 5.5 Z" />
          <circle cx="12" cy="4.4" r="1.1" fill="currentColor" />
          <path d="M17.5 10.8 L20.5 8.5" strokeWidth="1.7" />
          <path d="M6.5 12 C4.2 12 4.2 15.2 6.8 15.5" />
        </g>
      )}

      {name === 'tea-cup' && (
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 11 L19 11 C19 15.8 16.2 18.8 12 18.8 C7.8 18.8 5 15.8 5 11 Z" fill="rgba(196,138,54,0.35)" />
          <line x1="8.5" y1="20.5" x2="15.5" y2="20.5" />
          <path d="M9.5 8.5 Q8.8 6.5 10 4.8" opacity="0.85" />
          <path d="M14 8.5 Q13.3 6.5 14.5 4.8" opacity="0.85" />
        </g>
      )}

      {name === 'brass-cog' && (
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3.4" fill="rgba(231,185,106,0.28)" />
          <path d="M12 3.2 L12 5.4 M12 18.6 L12 20.8 M3.2 12 L5.4 12 M18.6 12 L20.8 12 M5.8 5.8 L7.4 7.4 M16.6 16.6 L18.2 18.2 M18.2 5.8 L16.6 7.4 M7.4 16.6 L5.8 18.2" />
          <circle cx="12" cy="12" r="6.6" strokeDasharray="3.2 2" />
        </g>
      )}

      {name === 'yin-yang' && (
        <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.5" fill="rgba(231,185,106,0.16)" />
          <path d="M12 3.5 A4.25 4.25 0 0 1 12 12 A4.25 4.25 0 0 0 12 20.5" />
          <circle cx="12" cy="7.75" r="1.2" fill="currentColor" />
          <circle cx="12" cy="16.25" r="1.2" fill="none" />
        </g>
      )}

      {name === 'check-seal' && (
        <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8.5" fill="rgba(88,211,175,0.16)" />
          <path d="M8.2 12.2 L10.8 14.8 L16 9.2" />
        </g>
      )}

      {name === 'star-seal' && (
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <polygon
            points="12,3.5 14.4,8.9 20.2,9.5 15.8,13.4 17.1,19.1 12,16.1 6.9,19.1 8.2,13.4 3.8,9.5 9.6,8.9"
            fill="rgba(231,185,106,0.42)"
          />
        </g>
      )}
    </svg>
  );
};
