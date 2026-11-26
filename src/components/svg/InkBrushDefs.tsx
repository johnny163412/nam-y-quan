import React from 'react';

/**
 * Global SVG filters giving lines and watercolor washes the gentle irregularity
 * of traditional Vietnamese hand-brushed woodblock & Dó-paper illustrations.
 */
export const InkBrushDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    aria-hidden="true"
    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
  >
    <defs>
      <filter id="ink-brush" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.032"
          numOctaves={2}
          seed={7}
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale={1.65}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      <filter id="ink-brush-soft" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.042"
          numOctaves={2}
          seed={11}
          result="noiseSoft"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noiseSoft"
          scale={1.1}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
);
